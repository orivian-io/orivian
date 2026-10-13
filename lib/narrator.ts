'use client'

// Lesson narration player. Plays pre-generated Kokoro audio from Supabase
// Storage so every learner hears the same voice on any browser or device,
// and reports which sentence/word is being spoken for read-along
// highlighting. Falls back to the browser's own voice for any block whose
// audio hasn't been generated yet.

import { supabase } from '@/lib/supabase'
import {
  DEFAULT_VOICE,
  NARRATION_BUCKET,
  PREVIEW_TEXT,
  hashSpeechText,
  isNarrationVoice,
  narrationPaths,
  wordAtTime,
  type NarrationManifest,
  type NarrationVoiceId,
  type Span,
} from '@/lib/narration'
import { speakWithBrowser } from '@/lib/tts'

// ---------------------------------------------------------------------------
// Preferences (saved on this device)
// ---------------------------------------------------------------------------

// autoPlay: start reading each slide as soon as the learner moves to it
// with Next/Back, instead of waiting for a tap on Listen.
export type NarrationPrefs = { voice: NarrationVoiceId; rate: number; autoPlay: boolean }

export const RATE_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75] as const

const PREFS_KEY = 'orivian.narration.prefs'
const DEFAULT_PREFS: NarrationPrefs = { voice: DEFAULT_VOICE, rate: 1, autoPlay: false }

const listeners = new Set<() => void>()

export function subscribeNarration(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function getNarrationPrefs(): NarrationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}') as Partial<NarrationPrefs>
    return {
      voice: isNarrationVoice(parsed.voice) ? parsed.voice : DEFAULT_VOICE,
      rate: typeof parsed.rate === 'number' && parsed.rate >= 0.5 && parsed.rate <= 2 ? parsed.rate : 1,
      autoPlay: parsed.autoPlay === true,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function setNarrationPrefs(update: Partial<NarrationPrefs>) {
  const next = { ...getNarrationPrefs(), ...update }
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked (private browsing) - prefs just won't persist.
  }
  if (audio) audio.playbackRate = next.rate
  if (currentLessonId) void prefetchNarration(currentLessonId)
  listeners.forEach((fn) => fn())
}

// ---------------------------------------------------------------------------
// Manifests
// ---------------------------------------------------------------------------

function publicUrl(path: string) {
  return supabase.storage.from(NARRATION_BUCKET).getPublicUrl(path).data.publicUrl
}

const manifests = new Map<string, NarrationManifest | null>()
const pending = new Map<string, Promise<NarrationManifest | null>>()
let currentLessonId: string | null = null

// Loads the narration manifest for a lesson in the learner's chosen voice.
// Call this when a lesson opens so Listen can start instantly (mobile
// browsers only allow audio to start directly from a tap).
export function prefetchNarration(lessonId: string): Promise<NarrationManifest | null> {
  currentLessonId = lessonId
  const { voice } = getNarrationPrefs()
  const key = `${voice}/${lessonId}`
  if (manifests.has(key)) return Promise.resolve(manifests.get(key) ?? null)
  const inFlight = pending.get(key)
  if (inFlight) return inFlight

  // Cache-bust once a minute so newly generated audio shows up quickly.
  const url = `${publicUrl(narrationPaths.manifest(voice, lessonId))}?t=${Math.floor(Date.now() / 60000)}`
  const request = fetch(url)
    .then((res) => (res.ok ? (res.json() as Promise<NarrationManifest>) : null))
    .catch(() => null)
    .then((manifest) => {
      manifests.set(key, manifest)
      pending.delete(key)
      return manifest
    })
  pending.set(key, request)
  return request
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

export type NarrationProgress = { sentence: Span; word: Span | null }

export type NarrationOptions = {
  lessonId: string
  text: string
  onProgress?: (progress: NarrationProgress) => void
  onEnd?: () => void
}

let audio: HTMLAudioElement | null = null
let stopCurrent: (() => void) | null = null

function getAudio() {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
  }
  return audio
}

// True while lesson narration (or a voice sample) is playing. The study
// timer treats listening as activity, so learners who just listen aren't
// marked idle.
export function isNarrationPlaying(): boolean {
  if (audio && !audio.paused && !audio.ended) return true
  return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking
}

export function stopNarration() {
  const stop = stopCurrent
  stopCurrent = null
  stop?.()
}

export function startNarration(options: NarrationOptions) {
  stopNarration()
  const { voice } = getNarrationPrefs()
  const key = `${voice}/${options.lessonId}`

  if (manifests.has(key)) {
    playBlock(options, manifests.get(key) ?? null)
    return
  }

  // Manifest not loaded yet (rare - it's prefetched when the lesson opens).
  let cancelled = false
  stopCurrent = () => {
    cancelled = true
    options.onEnd?.()
  }
  void prefetchNarration(options.lessonId).then((manifest) => {
    if (cancelled) return
    playBlock(options, manifest)
  })
}

function playBlock(options: NarrationOptions, manifest: NarrationManifest | null) {
  const { text, onProgress, onEnd } = options
  const block = manifest?.blocks[hashSpeechText(text)]
  if (!block) {
    playWithBrowser(options)
    return
  }

  const el = getAudio()
  const segments = block.segments
  let frame = 0
  let ended = false
  let lastWordFrom = -1

  const finish = () => {
    if (ended) return
    ended = true
    cancelAnimationFrame(frame)
    el.onended = null
    el.onerror = null
    el.pause()
    onEnd?.()
  }

  const tick = () => {
    const t = el.currentTime
    let seg = segments[0]
    for (const s of segments) {
      if (s.start <= t) seg = s
      else break
    }
    if (seg) {
      const word = t <= seg.end ? wordAtTime(text, seg, seg.end - seg.start, t - seg.start) : null
      const wordFrom = word ? word.from : -seg.from - 1
      if (wordFrom !== lastWordFrom) {
        lastWordFrom = wordFrom
        onProgress?.({ sentence: { from: seg.from, to: seg.to }, word })
      }
    }
    if (!ended) frame = requestAnimationFrame(tick)
  }

  stopCurrent = finish
  el.onended = finish
  el.onerror = () => {
    // Audio file missing or network error - read it with the browser voice.
    if (ended) return
    ended = true
    cancelAnimationFrame(frame)
    el.onended = null
    el.onerror = null
    playWithBrowser(options)
  }
  el.src = publicUrl(block.file)
  el.playbackRate = getNarrationPrefs().rate
  el.play()
    .then(() => {
      if (!ended) frame = requestAnimationFrame(tick)
    })
    .catch((err: unknown) => {
      if (ended) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      ended = true
      el.onended = null
      el.onerror = null
      playWithBrowser(options)
    })
}

function playWithBrowser({ text, onProgress, onEnd }: NarrationOptions) {
  stopCurrent = speakWithBrowser(text, {
    rate: getNarrationPrefs().rate,
    onProgress: (sentence, word) => onProgress?.({ sentence, word }),
    onEnd,
  })
}

// Plays a short sample of a voice for the settings panel.
export function previewVoice(voice: NarrationVoiceId, onEnd?: () => void) {
  stopNarration()
  const el = getAudio()
  let ended = false
  const finish = () => {
    if (ended) return
    ended = true
    el.onended = null
    el.onerror = null
    el.pause()
    onEnd?.()
  }
  stopCurrent = finish
  el.onended = finish
  el.onerror = () => {
    if (ended) return
    ended = true
    el.onended = null
    el.onerror = null
    stopCurrent = speakWithBrowser(PREVIEW_TEXT, { rate: getNarrationPrefs().rate, onEnd })
  }
  el.src = publicUrl(narrationPaths.preview(voice))
  el.playbackRate = getNarrationPrefs().rate
  el.play().catch(() => el.onerror?.(new Event('error')))
}
