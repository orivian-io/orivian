'use client'

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; style: 'bullet' | 'numbered'; items: string[] }
  | { type: 'callout'; variant: 'info' | 'warning' | 'tip'; text: string }
  | { type: 'key_term'; term: string; definition: string }
  | { type: 'group'; heading?: string; blocks: ContentBlock[] }
  | { type: 'title'; text: string; overview: string; examContext: string }

// Text content can contain lightweight **bold** markdown for on-screen
// emphasis. Strip it before handing text to the speech synthesizer so it
// doesn't read the asterisks aloud.
function stripBold(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/\*\*(.+?)\*\*/g, '$1')
}

// Converts a structured lesson content block into plain text for the
// browser's built-in voice to read aloud.
export function blockToSpeechText(block: ContentBlock): string {
  switch (block.type) {
    case 'heading':
      return stripBold(block.text)
    case 'paragraph':
      return stripBold(block.text)
    case 'list':
      return block.items.map(stripBold).join('. ')
    case 'callout':
      return stripBold(block.text)
    case 'key_term':
      return `${block.term}: ${stripBold(block.definition)}`
    case 'group':
      return [block.heading, ...block.blocks.map(blockToSpeechText)]
        .filter(Boolean)
        .join('. ')
    case 'title':
      return [
        stripBold(block.text),
        stripBold(block.overview),
        `How this shows up on the exam: ${stripBold(block.examContext)}`,
      ].join('. ')
    default:
      return ''
  }
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// ---------------------------------------------------------------------------
// Voice preferences
//
// Voices come from the learner's own browser and operating system, so they
// differ per device. Preferences are therefore saved in localStorage (per
// device) rather than in the learner's profile.
// ---------------------------------------------------------------------------

export type TtsPrefs = {
  // null means "Automatic": use the best voice this device offers.
  voiceURI: string | null
  rate: number
}

export const RATE_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75] as const

const PREFS_KEY = 'orivian.tts.prefs'
const DEFAULT_PREFS: TtsPrefs = { voiceURI: null, rate: 1 }

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

// Lets UI (the voice picker) re-render when prefs change or when the
// browser finishes loading its voice list.
export function subscribeTts(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getPrefs(): TtsPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<TtsPrefs>
    return {
      voiceURI: typeof parsed.voiceURI === 'string' ? parsed.voiceURI : null,
      rate: typeof parsed.rate === 'number' && parsed.rate >= 0.5 && parsed.rate <= 2 ? parsed.rate : 1,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function setPrefs(update: Partial<TtsPrefs>) {
  const next = { ...getPrefs(), ...update }
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked (private mode etc.) - prefs just won't persist.
  }
  notify()
}

export function resetPrefs() {
  try {
    window.localStorage.removeItem(PREFS_KEY)
  } catch {
    // ignore
  }
  notify()
}

// ---------------------------------------------------------------------------
// Voice discovery and ranking
// ---------------------------------------------------------------------------

let cachedVoices: SpeechSynthesisVoice[] = []
let voicesListenerAttached = false

function refreshVoices() {
  if (!isSpeechSupported()) return
  const list = window.speechSynthesis.getVoices()
  if (list.length > 0) {
    cachedVoices = list
    notify()
  }
}

function attachVoicesListener() {
  if (voicesListenerAttached || !isSpeechSupported()) return
  voicesListenerAttached = true
  // Chrome and Edge load voices asynchronously (Edge's online "Natural"
  // voices can arrive a moment after page load).
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
  refreshVoices()
}

// Resolves with the voice list, waiting briefly for browsers that load
// voices asynchronously.
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([])
  attachVoicesListener()
  if (cachedVoices.length > 0) return Promise.resolve(cachedVoices)
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done)
      clearTimeout(timer)
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }
    const timer = setTimeout(done, 1500)
    window.speechSynthesis.addEventListener('voiceschanged', done)
  })
}

export function getCachedVoices() {
  attachVoicesListener()
  return cachedVoices
}

// macOS ships a set of novelty voices that should never be offered.
const NOVELTY_VOICES = new Set([
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged',
  'fred', 'good news', 'hysterical', 'jester', 'junior', 'kathy', 'organ',
  'pipe organ', 'princess', 'ralph', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox',
])

// Microsoft's neural voices that sound best for long-form narration.
const FAVORITE_NAMES = ['ava', 'andrew', 'emma', 'brian', 'jenny', 'aria', 'guy', 'sonia', 'ryan']

function isEnglish(v: SpeechSynthesisVoice) {
  return v.lang.toLowerCase().replace('_', '-').startsWith('en')
}

function isNovelty(v: SpeechSynthesisVoice) {
  const base = v.name.toLowerCase().replace(/\s*\(.*\)\s*$/, '').trim()
  return NOVELTY_VOICES.has(base)
}

// Higher is better. 60+ counts as a "recommended" natural-sounding voice.
export function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase()
  const lang = v.lang.toLowerCase().replace('_', '-')
  let score = 0

  if (name.includes('natural')) score += 100 // Microsoft Edge neural voices
  else if (name.includes('premium')) score += 85 // Apple premium voices
  else if (name.includes('enhanced')) score += 75 // Apple enhanced voices
  else if (name.startsWith('google')) score += 60 // Chrome's online Google voices

  if (FAVORITE_NAMES.some((n) => name.includes(n))) score += 15
  if (!v.localService) score += 5
  if (lang === 'en-us') score += 6
  else if (lang === 'en-gb') score += 4
  if (name.includes('espeak')) score -= 40

  return score
}

export const RECOMMENDED_SCORE = 60

// English voices only (all course content is English), best first.
export function rankVoices(voices: SpeechSynthesisVoice[]) {
  return voices
    .filter((v) => isEnglish(v) && !isNovelty(v))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a) || a.name.localeCompare(b.name))
}

export function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return rankVoices(voices)[0] ?? null
}

function resolveVoice(voices: SpeechSynthesisVoice[], prefs: TtsPrefs) {
  if (prefs.voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === prefs.voiceURI)
    if (chosen) return chosen
  }
  return pickDefaultVoice(voices)
}

const REGIONS: Record<string, string> = {
  'en-us': 'US', 'en-gb': 'UK', 'en-au': 'Australia', 'en-ca': 'Canada',
  'en-ie': 'Ireland', 'en-in': 'India', 'en-nz': 'New Zealand', 'en-za': 'South Africa',
}

// "Microsoft Ava Online (Natural) - English (United States)" -> "Ava"
export function voiceLabel(v: SpeechSynthesisVoice): string {
  let name = v.name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s+Online/i, '')
    .replace(/\s*\((Natural|Premium|Enhanced)\)/i, '')
    .replace(/\s*-\s*English.*$/i, '')
    .trim()
  if (!name) name = v.name
  const region = REGIONS[v.lang.toLowerCase().replace('_', '-')]
  return region && !/US English|UK English/i.test(name) ? `${name} (${region})` : name
}

// ---------------------------------------------------------------------------
// Speaking
// ---------------------------------------------------------------------------

// Chrome silently stops speaking long utterances after ~15 seconds with its
// online voices, so long text is split into sentence-sized chunks.
const MAX_CHUNK = 220

function splitIntoChunks(text: string): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?;:])\s+/)
    .filter(Boolean)

  const pieces: string[] = []
  for (const sentence of sentences) {
    if (sentence.length <= MAX_CHUNK) {
      pieces.push(sentence)
      continue
    }
    // Very long sentence: break on commas, then on words as a last resort.
    let buffer = ''
    for (const word of sentence.split(' ')) {
      if ((buffer + ' ' + word).trim().length > MAX_CHUNK) {
        if (buffer) pieces.push(buffer.trim())
        buffer = word
      } else {
        buffer = `${buffer} ${word}`
        if (word.endsWith(',') && buffer.length > MAX_CHUNK / 2) {
          pieces.push(buffer.trim())
          buffer = ''
        }
      }
    }
    if (buffer.trim()) pieces.push(buffer.trim())
  }

  // Merge short neighbours so speech doesn't pause after every sentence.
  const chunks: string[] = []
  for (const piece of pieces) {
    const last = chunks[chunks.length - 1]
    if (last && last.length + piece.length + 1 <= MAX_CHUNK) chunks[chunks.length - 1] = `${last} ${piece}`
    else chunks.push(piece)
  }
  return chunks
}

let sequence = 0
let current: { id: number; onEnd?: () => void } | null = null

function finish(id: number) {
  if (!current || current.id !== id) return
  const cb = current.onEnd
  current = null
  cb?.()
}

// Speaks text with the learner's chosen (or best available) voice. onEnd
// fires once when speech finishes or is interrupted for any reason.
export function speak(text: string, onEnd?: () => void) {
  if (!isSpeechSupported()) return
  stopSpeaking()

  const id = ++sequence
  current = { id, onEnd }
  const chunks = splitIntoChunks(text)
  if (chunks.length === 0) {
    finish(id)
    return
  }

  void loadVoices().then((voices) => {
    if (!current || current.id !== id) return
    const prefs = getPrefs()
    const voice = resolveVoice(voices, prefs)
    const synth = window.speechSynthesis

    chunks.forEach((chunk, i) => {
      const utterance = new SpeechSynthesisUtterance(chunk)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      }
      utterance.rate = prefs.rate
      if (i === chunks.length - 1) utterance.onend = () => finish(id)
      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return
        if (current?.id === id) synth.cancel()
        finish(id)
      }
      synth.speak(utterance)
    })
  })
}

export function stopSpeaking() {
  if (!isSpeechSupported()) return
  const previous = current
  current = null
  window.speechSynthesis.cancel()
  previous?.onEnd?.()
}

export const PREVIEW_TEXT =
  'Welcome to Orivian. This is how your lessons will sound. Let us get you ready for exam day.'
