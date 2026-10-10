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
// lower quality), --fake (test tones instead of Kokoro, for testing).
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
// project's .env.local. The service key never leaves this computer.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
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
  const args = { all: false, course: '', lessons: [] as string[], voices: [] as string[], force: false, dryRun: false, fast: false, fake: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--all') args.all = true
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
  const file = join(ROOT, '.env.local')
  if (!existsSync(file)) throw new Error(`Missing ${file}`)
  const env: Record<string, string> = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('.env.local needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  return { url, key }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { url, key } = loadEnv()
  const db = createClient(url, key, { auth: { persistSession: false } })
  const storage = db.storage.from(NARRATION_BUCKET)
  const previewDir = join(ROOT, '.narration-preview')

  // Lessons to narrate.
  const select = 'id, title, content_blocks, order_index'
  let lessons: { id: string; title: string; content_blocks: unknown; order_index: number }[] = []
  if (args.lessons.length) {
    const { data, error } = await db.from('lessons').select(select).in('id', args.lessons)
    if (error) throw error
    lessons = data ?? []
  } else {
    let courseQuery = db.from('courses').select('id, title')
    courseQuery = args.all ? courseQuery.eq('published', true) : courseQuery.eq('slug', args.course)
    const { data: courses, error } = await courseQuery.order('title')
    if (error) throw error
    if (!courses?.length) throw new Error(args.all ? 'No published courses found' : `Course "${args.course}" not found`)
    for (const course of courses) {
      const { data, error: lessonsError } = await db.from('lessons').select(select).eq('course_id', course.id).order('order_index')
      if (lessonsError) throw lessonsError
      console.log(`Course: ${course.title} (${data?.length ?? 0} lessons)`)
      lessons.push(...(data ?? []))
    }
  }
  if (!lessons.length) throw new Error('No lessons found')

  if (!args.dryRun) {
    const { error } = await db.storage.getBucket(NARRATION_BUCKET)
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
    const { error } = await storage.upload(path, body, { contentType, cacheControl, upsert: true })
    if (error) throw new Error(`Upload failed for ${path}: ${error.message}`)
  }

  const started = Date.now()
  let generated = 0
  let skipped = 0

  for (const voice of args.voices) {
    console.log(`\n=== Voice: ${voice} ===`)

    // Voice sample for the settings panel.
    const previewPath = narrationPaths.preview(voice)
    const hasPreview = !args.dryRun && (await storage.exists(previewPath)).data
    if (args.force || !hasPreview) {
      const { mp3 } = await narrate(synth, PREVIEW_TEXT, voice)
      await save(previewPath, mp3, 'audio/mpeg', '86400')
      console.log('  preview sample saved')
    }

    for (const lesson of lessons) {
      const blocks = (lesson.content_blocks as ContentBlock[]) || []
      const manifestPath = narrationPaths.manifest(voice, lesson.id)

      let previous: NarrationManifest | null = null
      if (!args.dryRun && !args.force) {
        const { data } = await storage.download(manifestPath)
        if (data) {
          try {
            const parsed = JSON.parse(await data.text()) as NarrationManifest
            if (parsed.version === NARRATION_VERSION) previous = parsed
          } catch {
            // Corrupt manifest - regenerate.
          }
        }
      }

      const next: Record<string, NarrationBlock> = {}
      let lessonGenerated = 0
      for (const block of blocks) {
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
        process.stdout.write(`  ${lesson.title} - block ${blocks.indexOf(block) + 1}/${blocks.length}... `)
        const { mp3, duration, segments } = await narrate(synth, text, voice)
        console.log(`${duration.toFixed(0)}s of audio in ${((Date.now() - blockStarted) / 1000).toFixed(0)}s`)
        const file = narrationPaths.block(voice, lesson.id, hash)
        await save(file, mp3, 'audio/mpeg', '31536000')
        next[hash] = { file, duration, segments }
        generated++
        lessonGenerated++
      }

      const changed = lessonGenerated > 0 || !previous || Object.keys(previous.blocks).length !== Object.keys(next).length
      if (changed) {
        const manifest: NarrationManifest = {
          version: NARRATION_VERSION,
          voice,
          lessonId: lesson.id,
          generatedAt: new Date().toISOString(),
          blocks: next,
        }
        await save(manifestPath, JSON.stringify(manifest), 'application/json', '60')

        // Remove audio for blocks that no longer exist.
        const stale = Object.values(previous?.blocks ?? {})
          .map((b) => b.file)
          .filter((f) => !Object.values(next).some((b) => b.file === f))
        if (stale.length && !args.dryRun) await storage.remove(stale)
      }

      const secs = Math.round((Date.now() - started) / 1000)
      console.log(`  ${lesson.title}: ${lessonGenerated ? `${lessonGenerated} block(s) generated` : 'up to date'}  [${secs}s elapsed]`)
    }
  }

  console.log(`\nDone. ${generated} block(s) generated, ${skipped} unchanged.`)
  if (args.dryRun) console.log(`Dry run: files written to ${previewDir}`)
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
