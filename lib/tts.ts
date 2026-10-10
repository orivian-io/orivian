'use client'

// Browser speech fallback. Orivian's narration normally plays pre-generated
// audio (see lib/narrator.ts); this is only used for content that has no
// generated audio yet. It picks the most natural voice the device offers.

import { splitSegments, type Span } from '@/lib/narration'

export { blockToSpeechText, type ContentBlock } from '@/lib/narration'

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([])
  const now = window.speechSynthesis.getVoices()
  if (now.length > 0) {
    cachedVoices = now
    return Promise.resolve(now)
  }
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

// macOS novelty voices that should never be used.
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|fred|good news|hysterical|jester|junior|kathy|organ|pipe organ|princess|ralph|superstar|trinoids|whisper|wobble|zarvox)\b/i

function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase()
  const lang = v.lang.toLowerCase().replace('_', '-')
  let score = 0
  if (name.includes('natural')) score += 100 // Microsoft Edge neural voices
  else if (name.includes('premium')) score += 85 // Apple premium voices
  else if (name.includes('enhanced')) score += 75 // Apple enhanced voices
  else if (name.startsWith('google')) score += 60 // Chrome's Google voices
  if (/\b(ava|andrew|emma|brian|jenny|aria|guy|sonia|ryan|samantha)\b/.test(name)) score += 15
  if (lang === 'en-us') score += 6
  else if (lang === 'en-gb') score += 4
  if (name.includes('espeak')) score -= 40
  return score
}

function bestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en') && !NOVELTY.test(v.name))
  english.sort((a, b) => scoreVoice(b) - scoreVoice(a))
  return english[0] ?? null
}

export type BrowserSpeechHandlers = {
  rate?: number
  // Called as each sentence starts, and on each word where the browser
  // reports word boundaries. Offsets are into the full text.
  onProgress?: (sentence: Span, word: Span | null) => void
  onEnd?: () => void
}

let session = 0

// Speaks text sentence by sentence (Chrome cuts off long utterances after
// ~15 seconds). Returns a function that stops speech.
export function speakWithBrowser(text: string, handlers: BrowserSpeechHandlers = {}): () => void {
  const id = ++session
  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    handlers.onEnd?.()
  }
  const stop = () => {
    if (session === id) session++
    if (isSpeechSupported()) window.speechSynthesis.cancel()
    finish()
  }

  if (!isSpeechSupported()) {
    finish()
    return stop
  }
  window.speechSynthesis.cancel()

  const segments = splitSegments(text)
  if (segments.length === 0) {
    finish()
    return stop
  }

  void loadVoices().then((voices) => {
    if (session !== id) return
    const voice = bestVoice(voices)
    const synth = window.speechSynthesis
    segments.forEach((seg, i) => {
      const utterance = new SpeechSynthesisUtterance(text.slice(seg.from, seg.to))
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      }
      utterance.rate = handlers.rate ?? 1
      utterance.onstart = () => {
        if (session === id) handlers.onProgress?.(seg, null)
      }
      utterance.onboundary = (e) => {
        if (session !== id || e.name !== 'word') return
        const from = seg.from + e.charIndex
        let to = from
        while (to < seg.to && !/\s/.test(text[to])) to++
        handlers.onProgress?.(seg, { from, to })
      }
      if (i === segments.length - 1) utterance.onend = () => session === id && finish()
      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return
        if (session === id) stop()
      }
      synth.speak(utterance)
    })
  })

  return stop
}
