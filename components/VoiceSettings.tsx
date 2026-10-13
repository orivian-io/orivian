'use client'

import { useEffect, useRef, useState } from 'react'
import { NARRATION_VOICES, DEFAULT_VOICE, type NarrationVoiceId } from '@/lib/narration'
import {
  RATE_OPTIONS,
  getNarrationPrefs,
  previewVoice,
  setNarrationPrefs,
  stopNarration,
  subscribeNarration,
  type NarrationPrefs,
} from '@/lib/narrator'

// "Voice" button beside Listen. Opens a panel to pick one of Orivian's
// narrator voices, a reading speed, and whether each slide is read
// automatically. Saved on this device.
export default function VoiceSettings({ onBeforePreview }: { onBeforePreview?: () => void }) {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<NarrationPrefs>({ voice: DEFAULT_VOICE, rate: 1, autoPlay: false })
  const [previewing, setPreviewing] = useState<NarrationVoiceId | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => setPrefs(getNarrationPrefs())
    sync()
    return subscribeNarration(sync)
  }, [])

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const togglePreview = (voice: NarrationVoiceId) => {
    if (previewing === voice) {
      stopNarration()
      return
    }
    onBeforePreview?.()
    setPreviewing(voice)
    previewVoice(voice, () => setPreviewing((v) => (v === voice ? null : v)))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="text-sm text-brand-secondary hover:text-brand-primary transition px-1.5 py-1 rounded"
        title="Narrator voice and speed"
      >
        Voice ▾
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Narration settings"
          className="absolute left-0 bottom-full mb-2 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-brand-muted/20 bg-brand-surface-raised p-4 shadow-xl shadow-black/40"
        >
          <p className="text-xs uppercase tracking-wide text-brand-secondary mb-2">Narrator</p>
          <div className="space-y-1.5" role="radiogroup" aria-label="Narrator voice">
            {NARRATION_VOICES.map((v) => {
              const selected = prefs.voice === v.id
              return (
                <div
                  key={v.id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 transition ${
                    selected ? 'border-brand-primary/60 bg-brand-primary/10' : 'border-brand-muted/20 hover:border-brand-muted/50'
                  }`}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setNarrationPrefs({ voice: v.id })}
                    className="flex-1 text-left"
                  >
                    <span className={`block text-sm ${selected ? 'text-brand-primary font-medium' : 'text-brand-text'}`}>
                      {v.name}
                      {v.id === DEFAULT_VOICE && <span className="ml-1.5 text-xs text-brand-muted">default</span>}
                    </span>
                    <span className="block text-xs text-brand-secondary">{v.description}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePreview(v.id)}
                    aria-label={previewing === v.id ? `Stop ${v.name} sample` : `Play ${v.name} sample`}
                    className="shrink-0 w-8 h-8 rounded-full border border-brand-primary/40 text-brand-primary text-xs hover:bg-brand-primary/10 transition"
                  >
                    {previewing === v.id ? '■' : '▶'}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-xs uppercase tracking-wide text-brand-secondary mb-1.5">Speed</p>
          <div className="grid grid-cols-5 gap-1">
            {RATE_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNarrationPrefs({ rate: r })}
                className={`rounded-md py-1.5 text-xs transition ${
                  prefs.rate === r
                    ? 'bg-brand-primary text-black font-medium'
                    : 'bg-brand-surface text-brand-secondary hover:text-brand-text'
                }`}
              >
                {r}×
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-start justify-between gap-3 border-t border-brand-muted/15 pt-4">
            <div>
              <p id="autoplay-label" className="text-sm text-brand-text">Auto-play each slide</p>
              <p className="text-xs text-brand-secondary">Start reading as soon as you press Next.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.autoPlay}
              aria-labelledby="autoplay-label"
              onClick={() => setNarrationPrefs({ autoPlay: !prefs.autoPlay })}
              className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                prefs.autoPlay ? 'bg-brand-primary' : 'bg-brand-muted/30'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-brand-bg shadow transition-transform ${
                  prefs.autoPlay ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
