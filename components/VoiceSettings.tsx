'use client'

import { useEffect, useRef, useState } from 'react'
import {
  PREVIEW_TEXT,
  RATE_OPTIONS,
  RECOMMENDED_SCORE,
  getCachedVoices,
  getPrefs,
  loadVoices,
  pickDefaultVoice,
  rankVoices,
  resetPrefs,
  scoreVoice,
  setPrefs,
  speak,
  stopSpeaking,
  subscribeTts,
  voiceLabel,
  type TtsPrefs,
} from '@/lib/tts'

// Small "Voice" button beside Listen that opens a panel where learners pick
// a narration voice and speed. Choices are saved on this device.
export default function VoiceSettings() {
  const [open, setOpen] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [prefs, setLocalPrefs] = useState<TtsPrefs>({ voiceURI: null, rate: 1 })
  const [previewing, setPreviewing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => {
      setVoices(rankVoices(getCachedVoices()))
      setLocalPrefs(getPrefs())
    }
    sync()
    loadVoices().then(sync)
    return subscribeTts(sync)
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

  const recommended = voices.filter((v) => scoreVoice(v) >= RECOMMENDED_SCORE)
  const others = voices.filter((v) => scoreVoice(v) < RECOMMENDED_SCORE)
  const autoVoice = pickDefaultVoice(voices)
  const selectedExists = prefs.voiceURI ? voices.some((v) => v.voiceURI === prefs.voiceURI) : false
  const selectValue = selectedExists ? (prefs.voiceURI as string) : 'auto'

  const preview = () => {
    if (previewing) {
      stopSpeaking()
      return
    }
    setPreviewing(true)
    speak(PREVIEW_TEXT, () => setPreviewing(false))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="text-sm text-brand-secondary hover:text-brand-primary transition px-1.5 py-1 rounded"
        title="Voice and speed"
      >
        Voice ▾
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Voice settings"
          className="absolute left-0 bottom-full mb-2 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-brand-muted/20 bg-brand-surface-raised p-4 shadow-xl shadow-black/40"
        >
          <label className="block text-xs uppercase tracking-wide text-brand-secondary mb-1.5" htmlFor="tts-voice">
            Voice
          </label>
          <select
            id="tts-voice"
            value={selectValue}
            onChange={(e) => setPrefs({ voiceURI: e.target.value === 'auto' ? null : e.target.value })}
            className="w-full rounded-md border border-brand-muted/30 bg-brand-surface px-2.5 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary"
          >
            <option value="auto">
              Automatic{autoVoice ? ` (${voiceLabel(autoVoice)})` : ''}
            </option>
            {recommended.length > 0 && (
              <optgroup label="Recommended — natural voices">
                {recommended.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {voiceLabel(v)}
                  </option>
                ))}
              </optgroup>
            )}
            {others.length > 0 && (
              <optgroup label="Other voices">
                {others.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {voiceLabel(v)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <div className="mt-4">
            <span className="block text-xs uppercase tracking-wide text-brand-secondary mb-1.5">Speed</span>
            <div className="grid grid-cols-5 gap-1">
              {RATE_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPrefs({ rate: r })}
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
          </div>

          {voices.length > 0 && recommended.length === 0 && (
            <p className="mt-4 text-xs leading-relaxed text-brand-secondary">
              This browser only offers basic voices. For much more natural narration, open Orivian in
              Microsoft Edge, which includes free natural voices, or in Chrome.
            </p>
          )}
          {voices.length === 0 && (
            <p className="mt-4 text-xs text-brand-secondary">Loading voices…</p>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={preview}
              className="rounded-md border border-brand-primary/50 px-3 py-1.5 text-sm text-brand-primary hover:bg-brand-primary/10 transition"
            >
              {previewing ? '■ Stop' : '▶ Preview'}
            </button>
            <button
              type="button"
              onClick={resetPrefs}
              className="text-xs text-brand-muted hover:text-brand-secondary transition"
            >
              Reset to default
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
