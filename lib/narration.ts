// Shared narration logic used by both the lesson player (browser) and the
// offline audio generator (tools/narration). Keep this file free of React,
// browser-only, and Node-only APIs so it runs in both places.

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; style: 'bullet' | 'numbered'; items: string[] }
  | { type: 'callout'; variant: 'info' | 'warning' | 'tip'; text: string }
  // `example` adds an "In practice" line: a real incident or workplace case.
  // `full` spells out an acronym term ("Recovery Point Objective"); it's shown
  // set apart from the definition, never merged into it.
  | { type: 'key_term'; term: string; full?: string; definition: string; example?: string }
  | { type: 'group'; heading?: string; blocks?: ContentBlock[]; items?: { label: string; value: string }[] }
  | { type: 'title'; text: string; overview: string; examContext: string }
  // Several terms on one slide, each with a one-line definition, optionally
  // beside a diagram. Replaces runs of single key-term slides.
  | { type: 'term_set'; heading: string; intro?: string; terms: { term: string; full?: string; short: string; mark?: string }[]; diagram?: Diagram }
  // A side-by-side table. `values` lines up with `columns`; `cue` is the
  // "exam cue" row - the words in a question that point to each column.
  // `columnsFull` lines up with `columns` and spells out acronym headers.
  | { type: 'compare'; heading: string; intro?: string; columns: string[]; columnsFull?: (string | null)[]; rows: { label: string; full?: string; values: string[] }[]; cue?: string[] }
  // An ungraded practice question: pick an answer, then see why.
  | { type: 'scenario'; prompt: string; choices: { id: string; text: string }[]; answer: string; why: string; trap?: string }
  | { type: 'diagram'; heading: string; caption?: string; diagram: Diagram }
  // Worked calculation with the learner's own numbers.
  | { type: 'calc'; heading: string; kind: 'ale'; intro?: string; defaults?: { assetValue: number; exposureFactor: number; aro: number } }

export type DiagramItem = { label: string; full?: string; note?: string; muted?: boolean }

// Diagrams are drawn by the lesson player from this data (no image files).
export type Diagram =
  | { kind: 'triad'; points: [DiagramItem, DiagramItem, DiagramItem]; center?: string }
  // Broadest tier first.
  | { kind: 'pyramid'; tiers: DiagramItem[]; top?: string; bottom?: string }
  // Left to right (stacks vertically on phones).
  | { kind: 'flow'; steps: DiagramItem[] }
  // A repeating loop.
  | { kind: 'cycle'; steps: DiagramItem[]; center?: string }
  // Ranked, first = highest.
  | { kind: 'ladder'; rungs: DiagramItem[]; top?: string; bottom?: string }
  // An event on a time axis: one span before it, consecutive spans after
  // it, and an optional bracket over all the after-spans.
  | { kind: 'timeline'; event: string; before?: DiagramItem; after: DiagramItem[]; total?: DiagramItem }

// ---------------------------------------------------------------------------
// Voices
// ---------------------------------------------------------------------------

// Curated Kokoro voices. Audio is pre-generated for each of these, so every
// learner hears the same voice on every browser, phone, and (later) the app.
// To add a voice: add it here, then run the generator for it.
export const NARRATION_VOICES = [
  { id: 'af_heart', name: 'Heart', description: 'Warm and clear · US' },
  { id: 'af_bella', name: 'Bella', description: 'Bright and upbeat · US' },
  { id: 'am_michael', name: 'Michael', description: 'Calm and steady · US' },
  { id: 'bf_emma', name: 'Emma', description: 'Polished · UK' },
  // Kokoro's Hindi-trained voice reading English (Indian accent).
  { id: 'hm_omega', name: 'Omega', description: 'Clear and measured · IN' },
] as const

export type NarrationVoiceId = (typeof NARRATION_VOICES)[number]['id']

export const DEFAULT_VOICE: NarrationVoiceId = 'af_heart'

export function isNarrationVoice(id: unknown): id is NarrationVoiceId {
  return NARRATION_VOICES.some((v) => v.id === id)
}

// ---------------------------------------------------------------------------
// Storage layout (Supabase Storage, public bucket)
//
//   lesson-audio/<voice>/preview.mp3
//   lesson-audio/<voice>/<lessonId>/manifest.json
//   lesson-audio/<voice>/<lessonId>/<hash>.mp3      (one file per content block)
// ---------------------------------------------------------------------------

export const NARRATION_BUCKET = 'lesson-audio'

// Bump to force every block to be regenerated (e.g. after changing how
// speech text is built).
export const NARRATION_VERSION = 1

export const PREVIEW_TEXT =
  'Welcome to Orivian. This is how your lessons will sound. Let us get you ready for exam day.'

export const narrationPaths = {
  preview: (voice: string) => `${voice}/preview.mp3`,
  manifest: (voice: string, lessonId: string) => `${voice}/${lessonId}/manifest.json`,
  block: (voice: string, lessonId: string, hash: string) => `${voice}/${lessonId}/${hash}.mp3`,
}

export type NarrationSegment = {
  // Character offsets into the block's speech text.
  from: number
  to: number
  // Seconds into the block's audio file.
  start: number
  end: number
}

export type NarrationBlock = {
  file: string
  duration: number
  segments: NarrationSegment[]
}

export type NarrationManifest = {
  version: number
  voice: string
  lessonId: string
  generatedAt: string
  // Keyed by hashSpeechText(speechText). A block whose text changed simply
  // has no entry until the generator is re-run, and the player falls back
  // to the browser voice for it.
  blocks: Record<string, NarrationBlock>
}

// ---------------------------------------------------------------------------
// Speech text
// ---------------------------------------------------------------------------

// Lesson text can contain lightweight markdown emphasis (**bold**,
// *italic*, ***both***) for on-screen styling. Strip every asterisk so none
// is ever read aloud as "asterisk". Text without asterisks is returned
// untouched, so existing narration audio keeps matching.
function stripBold(text: string | null | undefined): string {
  if (!text) return ''
  if (!text.includes('*')) return text
  return text.replace(/\*{1,3}(?=\S)([^*\n]+?)(?<=\S)\*{1,3}/g, '$1').replace(/\*+(?=\S)|(?<=\S)\*+/g, '')
}

// "RPO" + "Recovery Point Objective" is spoken "RPO, Recovery Point Objective".
function withFull(label: string, full?: string | null) {
  return full ? `${label}, ${full.replace(/ · /g, ', ')}` : label
}

function joinParts(parts: (string | undefined | null)[]) {
  return parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .map((p) => (/[.!?:;]$/.test(p) ? p : `${p}.`))
    .join(' ')
}

function rawSpeechText(block: ContentBlock): string {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
    case 'callout':
      return stripBold(block.text)
    case 'list':
      return joinParts((block.items ?? []).map(stripBold))
    case 'key_term':
      return joinParts([
        `${withFull(block.term, block.full)}: ${stripBold(block.definition)}`,
        block.example ? `In practice: ${stripBold(block.example)}` : '',
      ])
    case 'term_set':
      return joinParts([
        block.heading,
        stripBold(block.intro),
        ...(block.terms ?? []).map((t) => `${withFull(t.term, t.full)}: ${stripBold(t.short)}`),
      ])
    case 'compare':
      return joinParts([
        block.heading,
        stripBold(block.intro),
        ...(block.rows ?? []).map((r) =>
          joinParts([withFull(r.label, r.full), ...r.values.map((v, i) => `${block.columns[i] ?? ''}: ${stripBold(v)}`)]),
        ),
        block.cue ? joinParts(['Exam cues', ...block.cue.map((c, i) => `${block.columns[i] ?? ''}: ${stripBold(c)}`)]) : '',
      ])
    case 'scenario':
      // The answer is never read out - the learner should choose first.
      return joinParts([
        'Practice question',
        stripBold(block.prompt),
        `Is it ${(block.choices ?? []).map((c) => stripBold(c.text)).join(', or ')}?`,
      ])
    case 'diagram':
      return joinParts([block.heading, stripBold(block.caption), diagramSpeech(block.diagram)])
    case 'calc':
      return joinParts([
        block.heading,
        stripBold(block.intro),
        'Single loss expectancy equals asset value times exposure factor',
        'Annualized loss expectancy equals single loss expectancy times annualized rate of occurrence',
      ])
    case 'group':
      return joinParts([
        block.heading,
        ...(block.blocks ?? []).map(rawSpeechText),
        ...(block.items ?? []).map((item) => `${stripBold(item.label)}: ${stripBold(item.value)}`),
      ])
    case 'title':
      return joinParts([
        stripBold(block.text),
        stripBold(block.overview),
        block.examContext ? `How this shows up on the exam: ${stripBold(block.examContext)}` : '',
      ])
    default:
      return ''
  }
}

function diagramSpeech(d: Diagram | undefined): string {
  if (!d) return ''
  const item = (i: DiagramItem) => (i.note ? `${withFull(i.label, i.full)}: ${stripBold(i.note)}` : withFull(i.label, i.full))
  switch (d.kind) {
    case 'triad':
      return joinParts(d.points.map(item))
    case 'pyramid':
      return joinParts(d.tiers.map(item))
    case 'flow':
    case 'cycle':
      return joinParts(d.steps.map(item))
    case 'ladder':
      return joinParts(d.rungs.map(item))
    case 'timeline':
      return joinParts([d.before ? item(d.before) : '', d.event, ...d.after.map(item), d.total ? item(d.total) : ''])
    default:
      return ''
  }
}

// The exact text that is spoken for a content block. Whitespace is
// normalized so the browser and the generator always agree on it.
export function blockToSpeechText(block: ContentBlock): string {
  return speakable(rawSpeechText(block)).replace(/\s+/g, ' ').trim()
}

// Smooths written punctuation that text-to-speech reads awkwardly. Spaced
// dashes become pauses, spaced or en-dash number ranges are read as "to",
// a few written abbreviations are expanded, spaced slashes become pauses,
// and math symbols (×, ÷, Ω, °F) are spoken as words. Hyphenated words
// (non-repudiation, two-factor) and IDs like 800-88 or CVE-2021-44228 are
// left alone.
export function speakable(text: string): string {
  return text
    .replace(/(\d)\s*–\s*(\d)/g, '$1 to $2')
    .replace(/(\d)\s+-\s+(\d)/g, '$1 to $2')
    .replace(/\s+[-–—]+\s+/g, ', ')
    .replace(/(\w)—(\w)/g, '$1, $2')
    .replace(/\bvs\.?(?=\s)/gi, 'versus')
    .replace(/\be\.g\.,?/gi, 'for example,')
    .replace(/\bi\.e\.,?/gi, 'that is,')
    .replace(/\s+\/\s+/g, ', ')
    .replace(/\s*×\s*/g, ' times ')
    .replace(/\s*÷\s*/g, ' divided by ')
    .replace(/\s*\(Ω\)/g, '')
    .replace(/(\d)\s*Ω/g, '$1 ohms')
    .replace(/\s*Ω/g, ' ohms')
    .replace(/(\d)\s*°F\b/g, '$1 degrees Fahrenheit')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([.!?:;])/g, '$1')
}

// Short stable fingerprint of a block's speech text (FNV-1a, 2 rounds).
export function hashSpeechText(text: string): string {
  const input = `v${NARRATION_VERSION}|${text}`
  let h1 = 0x811c9dc5
  let h2 = 0x01000193 ^ input.length
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193)
    h2 = Math.imul(h2 ^ c, 0x5bd1e995)
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')
}

// ---------------------------------------------------------------------------
// Sentence and word splitting
// ---------------------------------------------------------------------------

export type Span = { from: number; to: number }

const MAX_SEGMENT = 240

// Splits speech text into sentence-sized spans (character offsets). Long
// sentences are broken at commas/semicolons, then at word boundaries, so
// each span stays short enough for every speech engine.
export function splitSegments(text: string, maxLength = MAX_SEGMENT): Span[] {
  const spans: Span[] = []
  const sentenceRe = /[^.!?]+(?:[.!?]+["')\]]*|$)/g
  let m: RegExpExecArray | null
  while ((m = sentenceRe.exec(text))) {
    if (!m[0]) {
      sentenceRe.lastIndex++
      continue
    }
    pushTrimmed(spans, text, m.index, m.index + m[0].length, maxLength)
  }
  return spans
}

function pushTrimmed(spans: Span[], text: string, from: number, to: number, maxLength: number) {
  while (from < to && /\s/.test(text[from])) from++
  while (to > from && /\s/.test(text[to - 1])) to--
  if (from >= to) return
  if (to - from <= maxLength) {
    spans.push({ from, to })
    return
  }
  // Too long: prefer the last comma/semicolon/colon before the limit,
  // otherwise the last space.
  const window = text.slice(from, from + maxLength)
  let cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(': '))
  if (cut < maxLength * 0.4) cut = window.lastIndexOf(' ')
  if (cut <= 0) cut = maxLength - 1
  pushTrimmed(spans, text, from, from + cut + 1, maxLength)
  pushTrimmed(spans, text, from + cut + 1, to, maxLength)
}

// Word spans (character offsets) within text.
export function wordSpans(text: string, offset = 0): Span[] {
  const spans: Span[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) spans.push({ from: offset + m.index, to: offset + m.index + m[0].length })
  return spans
}

// Lowercased letters/digits only - used to match spoken words to on-screen
// words regardless of punctuation and formatting.
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

// Estimates which word is being spoken at `elapsed` seconds into a segment,
// weighting by word length and adding time for punctuation pauses.
export function wordAtTime(text: string, segment: Span, duration: number, elapsed: number): Span | null {
  const words = wordSpans(text.slice(segment.from, segment.to), segment.from)
  if (words.length === 0) return null
  const weights = words.map(({ from, to }) => {
    const w = text.slice(from, to)
    let weight = normalizeWord(w).length + 2
    if (/[,;:]$/.test(w)) weight += 3
    return weight
  })
  const total = weights.reduce((a, b) => a + b, 0)
  const target = (Math.max(0, Math.min(elapsed, duration)) / Math.max(duration, 0.001)) * total
  let acc = 0
  for (let i = 0; i < words.length; i++) {
    acc += weights[i]
    if (target < acc) return words[i]
  }
  return words[words.length - 1]
}
