'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import BadgeMedal from '@/components/BadgeMedal'
import { ACCOLADES, badgeByKey, type AccoladeKind } from '@/lib/badges'

type Tone = 'perfect' | 'passed' | 'failed'

const TONE = {
  perfect: { text: 'text-brand-primary', stroke: 'var(--color-brand-primary)', border: 'border-brand-primary/40', glow: 'from-brand-primary/15' },
  passed: { text: 'text-brand-success', stroke: 'var(--color-brand-success)', border: 'border-brand-success/35', glow: 'from-brand-success/10' },
  failed: { text: 'text-brand-alert', stroke: 'var(--color-brand-alert)', border: 'border-brand-alert/35', glow: 'from-brand-alert/10' },
} as const

function toneFor(scorePercent: number, passed: boolean): Tone {
  if (scorePercent >= 100) return 'perfect'
  return passed ? 'passed' : 'failed'
}

function fmtPercent(n: number) {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1)
}

// Score dial: fills to the score, with a tick where the pass line sits.
function ScoreRing({ scorePercent, passThreshold, tone }: { scorePercent: number; passThreshold: number; tone: Tone }) {
  const r = 52
  const c = 2 * Math.PI * r
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(scorePercent))
    return () => cancelAnimationFrame(id)
  }, [scorePercent])

  return (
    <svg viewBox="0 0 128 128" className="h-32 w-32 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-brand-surface-raised)" strokeWidth="9" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke={TONE[tone].stroke}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - shown / 100)}
        className="orivian-ring-fill"
      />
      {scorePercent < 100 && (
        <line
          x1="64"
          y1="5"
          x2="64"
          y2="19"
          stroke="var(--color-brand-text)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
          transform={`rotate(${(passThreshold / 100) * 360 + 90} 64 64)`}
        />
      )}
    </svg>
  )
}

// The headline result card at the top of every exam results screen
// (lesson mini-exam, domain checkpoint, full practice exam). Scrolls itself
// into view on mount - the learner submits from the bottom of a long list of
// questions, and the results used to render with the score off-screen above.
export default function ExamResultHero({
  scorePercent,
  correctCount,
  questionCount,
  passThreshold,
  passed,
  heading,
  thresholdLabel = 'needed to pass',
  accolades = [],
  newBadges = [],
  repeatPerfect = false,
  children,
}: {
  scorePercent: number
  correctCount: number
  questionCount: number
  passThreshold: number
  passed: boolean
  heading: string
  thresholdLabel?: string
  accolades?: AccoladeKind[]
  newBadges?: string[]
  repeatPerfect?: boolean
  children?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const tone = toneFor(scorePercent, passed)
  const t = TONE[tone]
  const missed = questionCount - correctCount
  const eyebrow = tone === 'perfect' ? 'Perfect score' : tone === 'passed' ? 'Passed' : 'Not yet'

  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'start' })
  }, [])

  const visibleAccolades = accolades.filter((k) => k !== 'perfect')
  const badges = newBadges.map(badgeByKey).filter((b): b is NonNullable<typeof b> => !!b)

  return (
    <div
      ref={ref}
      className={`relative mb-8 scroll-mt-6 overflow-hidden rounded-2xl border ${t.border} bg-brand-surface`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.glow} to-transparent`} />
      <div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="relative">
          <ScoreRing scorePercent={scorePercent} passThreshold={passThreshold} tone={tone} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-4xl leading-none ${t.text}`}>
              {fmtPercent(scorePercent)}
              <span className="text-xl">%</span>
            </span>
            <span className="mt-1 text-xs text-brand-secondary">
              {correctCount}/{questionCount}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className={`font-display italic text-sm ${t.text}`}>{eyebrow}</p>
          <h1 className="mt-0.5 text-2xl font-medium">{heading}</h1>
          <p className="mt-1 text-sm text-brand-secondary">
            {correctCount} of {questionCount} correct
            {missed > 0 && <> · {missed} missed</>} · {passThreshold}% {thresholdLabel}
          </p>
          {repeatPerfect && (
            <p className="mt-1 text-xs text-brand-muted">
              You&apos;ve aced this one before — new exams count toward your badges.
            </p>
          )}
          {children}

          {(visibleAccolades.length > 0 || badges.length > 0) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {visibleAccolades.map((k) => (
                <span
                  key={k}
                  title={ACCOLADES[k].detail}
                  className="rounded-full border border-brand-primary/40 bg-brand-primary/10 px-3 py-1 text-xs text-brand-primary"
                >
                  {ACCOLADES[k].title}
                </span>
              ))}
              {badges.map((b) => (
                <Link
                  key={b.key}
                  href="/stats#badges"
                  title={b.description}
                  className="flex items-center gap-1.5 rounded-full border border-brand-primary/40 bg-brand-primary/10 py-0.5 pl-1 pr-3 text-xs text-brand-primary hover:bg-brand-primary/20 transition"
                >
                  <BadgeMedal glyph={b.glyph} className="h-6 w-6" />
                  New badge: {b.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact score line for the bottom of the results list, right above the
// action buttons - where the learner's eyes are after reviewing answers.
export function ExamScoreRecap({
  scorePercent,
  correctCount,
  questionCount,
  passed,
}: {
  scorePercent: number
  correctCount: number
  questionCount: number
  passed: boolean
}) {
  const tone = toneFor(scorePercent, passed)
  const t = TONE[tone]
  const label = tone === 'perfect' ? 'Perfect score' : tone === 'passed' ? 'Passed' : 'Not yet passed'
  return (
    <div className={`mb-4 flex items-center gap-4 rounded-xl border ${t.border} bg-brand-surface px-4 py-3`}>
      <span className={`font-display text-2xl leading-none ${t.text}`}>{fmtPercent(scorePercent)}%</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className={t.text}>{label}</span>
          <span className="text-brand-secondary"> · {correctCount}/{questionCount} correct</span>
        </p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-brand-surface-raised">
          <div className="h-full rounded-full" style={{ width: `${scorePercent}%`, background: t.stroke }} />
        </div>
      </div>
    </div>
  )
}
