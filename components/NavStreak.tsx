'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import StreakCalendar from '@/components/StreakCalendar'
import { fetchMyStats, nextTier, syncTimezone, tierFor, todayIn, type MyStats } from '@/lib/stats'

// 🔥 streak counter in the top menu. Opens a pop-up with the activity
// calendar, current and longest streak, and the next milestone.
export default function NavStreak({ userId }: { userId: string }) {
  const [stats, setStats] = useState<MyStats | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    syncTimezone(userId)
      .catch(() => {})
      .then(() => fetchMyStats())
      .then((s) => {
        if (!cancelled) setStats(s)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!stats) return null

  const { current, longest, studied_today } = stats.streak
  const tier = tierFor(current)
  const next = nextTier(current)

  const toggle = () => {
    if (!open) fetchMyStats().then((s) => s && setStats(s))
    setOpen((o) => !o)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title={studied_today ? `${current}-day streak` : current > 0 ? 'Complete a lesson today to keep your streak' : 'Start a streak'}
        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm tabular-nums transition ${
          studied_today
            ? 'border-brand-primary/50 text-brand-primary'
            : 'border-brand-muted/30 text-brand-secondary hover:text-brand-text'
        }`}
      >
        <span aria-hidden="true" className={studied_today ? '' : 'grayscale opacity-60'}>
          🔥
        </span>
        {current}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-brand-muted/20 bg-brand-surface-raised p-4 shadow-2xl shadow-black/50">
          <div className="mb-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-brand-surface p-3">
              <p className="text-2xl font-medium text-brand-primary tabular-nums">
                {tier?.emoji ?? '🔥'} {current}
              </p>
              <p className="text-xs text-brand-secondary">Current streak</p>
            </div>
            <div className="rounded-lg bg-brand-surface p-3">
              <p className="text-2xl font-medium tabular-nums">{longest}</p>
              <p className="text-xs text-brand-secondary">Longest streak</p>
            </div>
          </div>

          <p className="mb-4 text-center text-xs text-brand-secondary">
            {studied_today
              ? next
                ? `${next.days - current} more day${next.days - current === 1 ? '' : 's'} to unlock ${next.emoji} ${next.name}`
                : 'You’ve unlocked every streak badge. Legendary.'
              : current > 0
                ? 'Complete a lesson today to keep your streak alive.'
                : 'Complete a lesson to start a streak.'}
          </p>

          <StreakCalendar days={stats.days} today={todayIn(stats.timezone)} />

          <Link
            href="/stats"
            onClick={() => setOpen(false)}
            className="mt-4 block text-center text-sm text-brand-primary hover:underline"
          >
            All my stats →
          </Link>
        </div>
      )}
    </div>
  )
}
