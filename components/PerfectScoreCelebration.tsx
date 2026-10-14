'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CompassMoment, CloseIcon } from '@/components/Icons'
import BadgeMedal from '@/components/BadgeMedal'
import { ACCOLADES, badgeByKey, type AccoladeKind } from '@/lib/badges'

const SPARKS = 22

// Pop-up moment after an exam: shown for a perfect score, or whenever the
// attempt unlocked a new badge (e.g. Second Wind, Summit). Gold sparks burst
// from the compass; reduced-motion users get the same card without motion.
export default function PerfectScoreCelebration({
  scorePercent,
  correctCount,
  questionCount,
  accolades = [],
  newBadges = [],
  repeatPerfect = false,
}: {
  scorePercent: number
  correctCount: number
  questionCount: number
  accolades?: AccoladeKind[]
  newBadges?: string[]
  repeatPerfect?: boolean
}) {
  const perfect = scorePercent >= 100
  const badges = newBadges.map(badgeByKey).filter((b): b is NonNullable<typeof b> => !!b)
  const [open, setOpen] = useState(perfect || badges.length > 0)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  const extras = accolades.filter((k) => k !== 'perfect')
  const heading = perfect ? 'Perfect score' : badges.length > 1 ? 'New badges unlocked' : 'New badge unlocked'
  const sub = perfect
    ? repeatPerfect
      ? `${correctCount}/${questionCount} again — still flawless.`
      : `${correctCount}/${questionCount} — every question right.`
    : `You scored ${Number.isInteger(scorePercent) ? scorePercent : scorePercent.toFixed(1)}%.`

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm orivian-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-heading"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-brand-primary/40 bg-brand-surface p-6 pt-8 text-center shadow-2xl orivian-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-primary/15 to-transparent" />
        <button
          ref={closeRef}
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-brand-secondary hover:text-brand-text transition"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="relative mx-auto mb-4 h-24 w-24">
          <div className="absolute inset-0" aria-hidden="true">
            {Array.from({ length: SPARKS }).map((_, i) => (
              <span
                key={i}
                className="orivian-spark"
                style={{
                  ['--a' as string]: `${(360 / SPARKS) * i + (i % 2 ? 6 : 0)}deg`,
                  ['--d' as string]: `${58 + (i % 4) * 14}px`,
                  animationDelay: `${(i % 5) * 45}ms`,
                }}
              />
            ))}
          </div>
          <CompassMoment className="relative h-24 w-24 text-brand-primary" />
        </div>

        <h2 id="celebration-heading" className="relative font-display text-3xl text-brand-primary">
          {heading}
        </h2>
        <p className="relative mt-1 text-sm text-brand-secondary">{sub}</p>

        {extras.length > 0 && (
          <ul className="relative mt-5 space-y-2 text-left">
            {extras.map((k) => (
              <li key={k} className="rounded-lg border border-brand-primary/25 bg-brand-primary/5 px-3 py-2">
                <p className="text-sm text-brand-primary">{ACCOLADES[k].title}</p>
                <p className="text-xs text-brand-secondary">{ACCOLADES[k].detail}</p>
              </li>
            ))}
          </ul>
        )}

        {badges.length > 0 && (
          <div className="relative mt-5">
            {perfect && <p className="mb-2 text-xs uppercase tracking-wider text-brand-muted">Badge unlocked</p>}
            <div className="flex flex-wrap justify-center gap-4">
              {badges.map((b) => (
                <div key={b.key} className="w-28 orivian-pop-in">
                  <BadgeMedal glyph={b.glyph} className="mx-auto h-16 w-16" />
                  <p className="mt-1.5 text-sm">{b.name}</p>
                  <p className="text-xs text-brand-secondary leading-snug">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => setOpen(false)}
            className="rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-black hover:bg-brand-primary-light transition"
          >
            See results
          </button>
          <Link
            href="/stats#badges"
            className="rounded-md border border-brand-primary/50 px-4 py-2.5 text-sm text-brand-primary hover:bg-brand-primary/10 transition"
          >
            View badges
          </Link>
        </div>
      </div>
    </div>
  )
}
