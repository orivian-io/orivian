// Generates lesson narration audio with Kokoro (free, open-source TTS that
// runs on this computer) and uploads it to Supabase Storage, where the
// lesson player picks it up. Re-running is cheap: blocks whose text hasn't
// changed are skipped.
//
// Usage (from tools/narration):
//   npm install                                   (first time only)
//   npm run generate -- --all                     every published course, all voices
//   npm run generate -- --course cissp            all lessons, all voices
//   npm run generate -- --course cissp --voices af_heart
//   npm run generate -- --lesson <lesson-uuid>    one lesson
//   npm run generate -- --course cissp --dry-run  write MP3s locally, no upload
//
// Options: --force (regenerate everything), --fast (smaller model, slightly
// lower quality), --fake (test tones instead of Kokoro, for testing),
// --plan (list what still needs generating, as a GitHub Actions job matrix),
// --shard 2/5 (process every 5th lesson starting at the 2nd, for parallel runs).
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
// project's .env.local, or from environment variables (GitHub Actions).

import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { createSynth, narrate } from './audio'
import {
  NARRATION_BUCKET,
  NARRATION_VERSION,
  NARRATION_VOICES,
  PREVIEW_TEXT,
  blockToSpeechText,
  hashSpeechText,
  narrationPaths,
  type ContentBlock,
  type NarrationBlock,
  type NarrationManifest,
} from '../../lib/narration'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// ---------------------------------------------------------------------------
// Arguments and environment
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]) {
  const args = { plan: false, shard: 1, shards: 1, all: false, course: '', lessons: [] as string[], voices: [] as string[], force: false, dryRun: false, fast: false, fake: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--all') args.all = true
    else if (a === '--plan') args.plan = true
    else if (a === '--shard') {
      const m = (argv[++i] ?? '').match(/^(\d+)\/(\d+)$/)
      if (!m || +m[1] < 1 || +m[1] > +m[2]) throw new Error('--shard expects e.g. 2/5')
      args.shard = +m[1]
      args.shards = +m[2]
    }
    else if (a === '--course') args.course = argv[++i] ?? ''
    else if (a === '--lesson') args.lessons.push(argv[++i] ?? '')
    else if (a === '--voices') args.voices = (argv[++i] ?? '').split(',').map((v) => v.trim()).filter(Boolean)
    else if (a === '--force') args.force = true
    else if (a === '--dry-run') args.dryRun = true
    else if (a === '--fast') args.fast = true
    else if (a === '--fake') args.fake = true
    else throw new Error(`Unknown option: ${a}`)
  }
  if (!args.all && !args.course && args.lessons.length === 0) throw new Error('Pass --all, --course <slug> or --lesson <id>.')
  const known = NARRATION_VOICES.map((v) => v.id as string)
  if (args.voices.length === 0) args.voices = known
  for (const v of args.voices) if (!known.includes(v)) throw new Error(`Unknown voice "${v}". Known: ${known.join(', ')}`)
  return args
}

function loadEnv() {
  const env: Record<string, string> = {}
  const file = join(ROOT, '.env.local')
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or the environment')
  return { url, key }
}

// Retries network calls (uploads, downloads, queries) so a brief Wi-Fi or
// Supabase hiccup doesn't stop a multi-hour run.
async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 8): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= attempts) throw err
      const wait = Math.min(60, 2 ** attempt)
      const reason = err instanceof Error ? err.message : String(err)
      console.log(`\n    ! Network problem ${label} (${reason}). Retrying in ${wait}s (attempt ${attempt + 1}/${attempts})...`)
      await new Promise((r) => setTimeout(r, wait * 1000))
    }
  }
}

function formatDuration(ms: number) {
  const total = Math.round(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`
}


// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { url, key } = loadEnv()
  const db = createClient(url, key, { auth: { persistSession: false } })
  const storage = db.storage.from(NARRATION_BUCKET)

  // --plan: work out which course/voice pairs still have blocks to generate
  // and how many parallel jobs (shards) each needs. No audio is generated.
  async function planJobs(all: { id: string; courseSlug: string; content_blocks: unknown }[]) {
    const fetchManifest = (path: string) =>
      withRetry('loading manifest', async () => {
        const { data, error } = await storage.download(path)
        if (error) {
          if (/not.?found|404/i.test(`${error.message} ${(error as { status?: number }).status ?? ''}`)) return null
          throw new Error(error.message)
        }
        try {
          const parsed = JSON.parse(await data.text()) as NarrationManifest
          return parsed.version === NARRATION_VERSION ? parsed : null
        } catch {
          return null
        }
      })

    const remaining = new Map<string, number>() // "course|voice" -> characters left
    const tasks: (() => Promise<void>)[] = []
    for (const voice of args.voices) {
      for (const lesson of all) {
        tasks.push(async () => {
          const manifest = args.force ? null : await fetchManifest(narrationPaths.manifest(voice, lesson.id))
          let chars = 0
          for (const block of (lesson.content_blocks as ContentBlock[]) || []) {
            const text = blockToSpeechText(block)
            if (text && !manifest?.blocks[hashSpeechText(text)]) chars += text.length
          }
          const key = `${lesson.courseSlug}|${voice}`
          remaining.set(key, (remaining.get(key) ?? 0) + chars)
        })
      }
    }
    for (let i = 0; i < tasks.length; i += 16) await Promise.all(tasks.slice(i, i + 16).map((t) => t()))

    const CHARS_PER_JOB = 40000 // roughly 30-40 minutes of work on a GitHub runner
    const matrix: { course: string; voice: string; shard: number; shards: number }[] = []
    const rows: string[] = []
    for (const [key, chars] of [...remaining.entries()].sort()) {
      const [course, voice] = key.split('|')
      if (chars === 0) continue
      const shards = Math.min(12, Math.max(1, Math.ceil(chars / CHARS_PER_JOB)))
      for (let shard = 1; shard <= shards; shard++) matrix.push({ course, voice, shard, shards })
      rows.push(`| ${course} | ${voice} | ${chars.toLocaleString()} | ${shards} |`)
    }
    const totalChars = [...remaining.values()].reduce((a, b) => a + b, 0)
    console.log(rows.length ? ['| Course | Voice | Characters left | Jobs |', '|---|---|---|---|', ...rows].join('\n') : 'Everything is up to date.')
    console.log(`\n${matrix.length} job(s), ${totalChars.toLocaleString()} characters to generate.`)
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${JSON.stringify(matrix)}\ncount=${matrix.length}\n`)
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Narration plan\n\n${rows.length ? ['| Course | Voice | Characters left | Jobs |', '|---|---|---|---|', ...rows].join('\n') : 'Everything is up to date.'}\n`,
      )
    }
  }
  const previewDir = join(ROOT, '.narration-preview')

  // Lessons to narrate, ordered course -> domain/section -> lesson.
  type LessonRow = { id: string; title: string; content_blocks: unknown; order_index: number; section_id: string | null; course_id: string }
  type Lesson = LessonRow & { courseTitle: string; courseSlug: string; sectionTitle: string }
  const select = 'id, title, content_blocks, order_index, section_id, course_id'
  let courseFilter = db.from('courses').select('id, title, slug')
  if (args.lessons.length) {
    const { data, error } = await withRetry('loading lessons', async () => await db.from('lessons').select('course_id').in('id', args.lessons))
    if (error) throw error
    courseFilter = courseFilter.in('id', [...new Set((data ?? []).map((l) => l.course_id as string))])
  } else {
    courseFilter = args.all ? courseFilter.eq('published', true) : courseFilter.eq('slug', args.course)
  }
  const { data: courses, error: coursesError } = await withRetry('loading courses', async () => await courseFilter.order('title'))
  if (coursesError) throw coursesError
  if (!courses?.length) throw new Error(args.lessons.length ? 'No lessons found' : args.all ? 'No published courses found' : `Course "${args.course}" not found`)

  const lessons: Lesson[] = []
  for (const course of courses) {
    const [{ data: sections, error: sectionsError }, { data: rows, error: lessonsError }] = await withRetry('loading lessons', async () =>
      Promise.all([
        db.from('sections').select('id, title, order_index').eq('course_id', course.id),
        args.lessons.length
          ? db.from('lessons').select(select).eq('course_id', course.id).in('id', args.lessons)
          : db.from('lessons').select(select).eq('course_id', course.id),
      ]),
    )
    if (sectionsError) throw sectionsError
    if (lessonsError) throw lessonsError
    const sectionById = new Map((sections ?? []).map((sec) => [sec.id as string, sec]))
    const sorted = ((rows ?? []) as LessonRow[]).sort((a, b) => {
      const sa = a.section_id ? sectionById.get(a.section_id)?.order_index ?? 0 : 0
      const sb = b.section_id ? sectionById.get(b.section_id)?.order_index ?? 0 : 0
      return sa - sb || a.order_index - b.order_index
    })
    for (const row of sorted) {
      const sectionTitle = (row.section_id && (sectionById.get(row.section_id)?.title as string)) || 'Other lessons'
      lessons.push({ ...row, courseTitle: course.title as string, courseSlug: course.slug as string, sectionTitle })
    }
    if (!args.plan) console.log(`Course: ${course.title} (${sorted.length} lessons)`)
  }
  if (!lessons.length) throw new Error('No lessons found')

  if (args.plan) {
    await planJobs(lessons)
    return
  }
  if (args.shards > 1) {
    // Shards are taken per course so each parallel job gets a fair mix.
    const counters = new Map<string, number>()
    const kept = lessons.filter((lesson) => {
      const n = counters.get(lesson.courseSlug) ?? 0
      counters.set(lesson.courseSlug, n + 1)
      return n % args.shards === args.shard - 1
    })
    lessons.length = 0
    lessons.push(...kept)
    console.log(`Shard ${args.shard}/${args.shards}: ${lessons.length} lessons`)
  }

  if (!args.dryRun) {
    const { error } = await withRetry('checking storage', async () => await db.storage.getBucket(NARRATION_BUCKET))
    if (error) {
      console.log(`Creating public storage bucket "${NARRATION_BUCKET}"...`)
      const { error: createError } = await db.storage.createBucket(NARRATION_BUCKET, { public: true })
      if (createError) throw createError
    }
  }

  const synth = await createSynth(args.fast, args.fake)

  const save = async (path: string, body: Uint8Array | string, contentType: string, cacheControl: string) => {
    if (args.dryRun) {
      const file = join(previewDir, ...path.split('/'))
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, body)
      return
    }
    await withRetry(`uploading ${path}`, async () => {
      const { error } = await storage.upload(path, body, { contentType, cacheControl, upsert: true })
      if (error) throw new Error(error.message)
    })
  }

  const loadManifest = async (path: string): Promise<NarrationManifest | null> => {
    if (args.dryRun || args.force) return null
    return withRetry('loading manifest', async () => {
      const { data, error } = await storage.download(path)
      if (error) {
        // A missing manifest just means nothing has been generated yet.
        if (/not.?found|404/i.test(`${error.message} ${(error as { status?: number }).status ?? ''}`)) return null
        throw new Error(error.message)
      }
      try {
        const parsed = JSON.parse(await data.text()) as NarrationManifest
        return parsed.version === NARRATION_VERSION ? parsed : null
      } catch {
        return null // Corrupt manifest - regenerate.
      }
    })
  }

  const started = Date.now()
  let generated = 0
  let skipped = 0

  for (const voice of args.voices) {
    console.log(`\n=== Voice: ${voice} ===`)

    // Voice sample for the settings panel.
    const previewPath = narrationPaths.preview(voice)
    const hasPreview = !args.dryRun && (await withRetry('checking preview', async () => (await storage.exists(previewPath)).data))
    if (args.force || !hasPreview) {
      const { mp3 } = await narrate(synth, PREVIEW_TEXT, voice)
      await save(previewPath, mp3, 'audio/mpeg', '86400')
      console.log('  preview sample saved')
    }

    let currentCourse = ''
    let currentSection = ''
    for (const [index, lesson] of lessons.entries()) {
      if (lesson.courseTitle !== currentCourse) {
        currentCourse = lesson.courseTitle
        currentSection = ''
        console.log(`\n━━ ${currentCourse} ━━`)
      }
      if (lesson.sectionTitle !== currentSection) {
        currentSection = lesson.sectionTitle
        console.log(`\n  ▸ ${currentSection}`)
      }

      const blocks = (lesson.content_blocks as ContentBlock[]) || []
      const manifestPath = narrationPaths.manifest(voice, lesson.id)
      const previous = await loadManifest(manifestPath)
      const counter = `[${index + 1}/${lessons.length}]`

      const next: Record<string, NarrationBlock> = {}
      const writeManifest = () =>
        save(
          manifestPath,
          JSON.stringify({ version: NARRATION_VERSION, voice, lessonId: lesson.id, generatedAt: new Date().toISOString(), blocks: next } satisfies NarrationManifest),
          'application/json',
          '60',
        )

      let lessonGenerated = 0
      for (const [blockIndex, block] of blocks.entries()) {
        const text = blockToSpeechText(block)
        if (!text) continue
        const hash = hashSpeechText(text)
        if (next[hash]) continue
        const existing = previous?.blocks[hash]
        if (existing) {
          next[hash] = existing
          skipped++
          continue
        }
        const blockStarted = Date.now()
        process.stdout.write(`    ${lesson.title} · block ${blockIndex + 1}/${blocks.length}... `)
        const { mp3, duration, segments } = await narrate(synth, text, voice)
        const file = narrationPaths.block(voice, lesson.id, hash)
        await save(file, mp3, 'audio/mpeg', '31536000')
        next[hash] = { file, duration, segments }
        // Save progress after every block so an interruption loses at most one block.
        await writeManifest()
        console.log(`${duration.toFixed(0)}s of audio in ${((Date.now() - blockStarted) / 1000).toFixed(0)}s`)
        generated++
        lessonGenerated++
      }

      const changed = lessonGenerated > 0 || !previous || Object.keys(previous.blocks).length !== Object.keys(next).length
      if (changed) {
        if (lessonGenerated === 0) await writeManifest()
        // Remove audio for blocks that no longer exist.
        const stale = Object.values(previous?.blocks ?? {})
          .map((b) => b.file)
          .filter((f) => !Object.values(next).some((b) => b.file === f))
        if (stale.length && !args.dryRun) await withRetry('removing old audio', async () => void (await storage.remove(stale)))
      }

      const elapsed = formatDuration(Date.now() - started)
      console.log(`    ${counter} ${lesson.title}: ${lessonGenerated ? `${lessonGenerated} block(s) generated` : 'up to date'}  [${elapsed} elapsed]`)
    }
  }

  console.log(`\nDone. ${generated} block(s) generated, ${skipped} unchanged.`)
  if (args.dryRun) console.log(`Dry run: files written to ${previewDir}`)
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
