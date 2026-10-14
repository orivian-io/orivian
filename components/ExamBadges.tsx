'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BadgeMedal from '@/components/BadgeMedal'
import { badgeStatuses, type AccoladeEvent, type BadgeStatus } from '@/lib/badges'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Exam badge shelf for /stats. Reads the learner's own accolade history
// (RLS: own rows only) and renders every badge, earned or not, with
// progress toward the next one. Renders nothing if the accolades table
// isn't there yet (migration 0029 not run).
export default function ExamBadges({ userId, today }: { userId: string; today: string }) {
  const [events, setEvents] = useState<AccoladeEvent[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    supabase
      .from('accolade_events')
      .select('kind, created_at, local_day')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) setFailed(true)
        else setEvents((data ?? []) as AccoladeEvent[])
      })
  }, [userId])

  // Arriving from "View badges" (/stats#badges): the shelf renders after the
  // stats load, so the browser's own hash jump has already missed it.
  useEffect(() => {
    if (events && window.location.hash === '#badges') {
      document.getElementById('badges')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [events])

  if (failed) return null

  const statuses: BadgeStatus[] = badgeStatuses(events ?? [])
  const earnedCount = statuses.filter((s) => s.earned).length
  const perfectToday = (events ?? []).some((e) => e.kind === 'daily_perfect' && e.local_day === today)
  const perfects = (events ?? []).filter((e) => e.kind === 'perfect').length

  return (
    <section id="badges" className="mb-12 scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium">Exam badges</h2>
          <p className="text-sm text-brand-secondary">
            {events === null ? 'Loading…' : `${earnedCount} of ${statuses.length} earned · ${perfects} perfect ${perfects === 1 ? 'score' : 'scores'}`}
          </p>
        </div>
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
            perfectToday ? 'border-brand-primary/40 bg-brand-primary/10' : 'border-brand-muted/15 bg-brand-surface'
          }`}
        >
          <BadgeMedal glyph="compass" earned={perfectToday} className="h-9 w-9" />
          <div>
            <p className={`text-sm ${perfectToday ? 'text-brand-primary' : 'text-brand-text'}`}>Today&apos;s True North</p>
            <p className="text-xs text-brand-secondary">
              {perfectToday ? 'Earned — a perfect score today' : 'Ace a new exam today to earn it'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statuses.map((b) => (
          <div
            key={b.key}
            className={`rounded-xl border p-4 text-center ${
              b.earned ? 'border-brand-primary/40 bg-brand-primary/10' : 'border-brand-muted/15 bg-brand-surface'
            }`}
            title={b.earned && b.earnedAt ? `Earned ${fmtDate(b.earnedAt)}` : b.description}
          >
            <BadgeMedal glyph={b.glyph} earned={b.earned} className="mx-auto mb-2 h-14 w-14" />
            <p className={`text-sm ${b.earned ? 'text-brand-text' : 'text-brand-muted'}`}>{b.name}</p>
            <p className="text-xs leading-snug text-brand-secondary">{b.description}</p>
            {b.earned && b.earnedAt ? (
              <p className="mt-2 text-[11px] text-brand-primary">Earned {fmtDate(b.earnedAt)}</p>
            ) : b.threshold > 1 && b.count > 0 ? (
              <>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-brand-muted/20">
                  <div className="h-full bg-brand-primary/60" style={{ width: `${Math.min(100, (b.count / b.threshold) * 100)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-brand-muted">{b.count}/{b.threshold}</p>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
