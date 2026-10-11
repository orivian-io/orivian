'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import StreakCalendar from '@/components/StreakCalendar'
import LevelBadge from '@/components/LevelBadge'
import { levelFor, type LevelInfo } from '@/lib/levels'
import Avatar from '@/components/Avatar'
import { avatarsUnlockedBetween, type AvatarDef } from '@/lib/avatars'
import { fetchMyStats, nextTier, syncTimezone, tierFor, todayIn, type MyStats } from '@/lib/stats'

const LEVEL_KEY = 'orivian.level.'

function readSeenLevel(userId: string): number | null {
  try {
    const v = localStorage.getItem(LEVEL_KEY + userId)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

function writeSeenLevel(userId: string, level: number) {
  try {
    localStorage.setItem(LEVEL_KEY + userId, String(level))
  } catch {
    // storage blocked - level-up messages just won't be remembered
  }
}

// 🔥 streak counter in the top menu. Opens a pop-up with the activity
// calendar, current and longest streak, level, and the next milestone.
// Refreshes when a lesson or exam is finished, and celebrates level-ups.
export default function NavStreak({ userId }: { userId: string }) {
  const [stats, setStats] = useState<MyStats | null>(null)
  const [open, setOpen] = useState(false)
  const [levelUp, setLevelUp] = useState<{ info: LevelInfo; unlocked: AvatarDef[] } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const apply = (s: MyStats | null) => {
      if (cancelled || !s) return
      setStats(s)
      const info = levelFor(s.xp.total)
      const seen = readSeenLevel(userId)
      // Only celebrate a level reached since we last looked (not on first visit).
      if (seen !== null && info.level > seen) setLevelUp({ info, unlocked: avatarsUnlockedBetween(seen, info.level) })
      if (seen === null || info.level !== seen) writeSeenLevel(userId, info.level)
    }

    syncTimezone(userId)
      .catch(() => {})
      .then(() => fetchMyStats())
      .then(apply)

    const onProgress = () => {
      // Give the server a moment to record the attempt before re-reading.
      setTimeout(() => fetchMyStats().then(apply), 800)
    }
    window.addEventListener('orivian:progress', onProgress)
    return () => {
      cancelled = true
      window.removeEventListener('orivian:progress', onProgress)
    }
  }, [userId])

  useEffect(() => {
    if (!levelUp) return
    const t = setTimeout(() => setLevelUp(null), levelUp.unlocked.length > 0 ? 12000 : 7000)
    return () => clearTimeout(t)
  }, [levelUp])

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
          <div className="mb-4">
            <LevelBadge xp={stats.xp.total} variant="card" />
          </div>
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

      {levelUp && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[80] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-brand-primary/60 bg-brand-surface-raised px-5 py-4 text-center shadow-2xl shadow-black/60"
        >
          <button
            type="button"
            onClick={() => setLevelUp(null)}
            className="absolute right-3 top-2 text-brand-muted hover:text-brand-text"
            aria-label="Dismiss"
          >
            ✕
          </button>
          <p className="text-3xl mb-1" aria-hidden="true">
            🎉 {levelUp.info.emoji}
          </p>
          <p className="font-medium text-brand-primary">Level up!</p>
          <p className="text-sm text-brand-text">
            You reached Level {levelUp.info.level} · {levelUp.info.title}
          </p>
          {levelUp.unlocked.length > 0 && (
            <div className="mt-3 border-t border-brand-muted/20 pt-3">
              <p className="text-xs uppercase tracking-wide text-brand-secondary mb-2">
                New avatar{levelUp.unlocked.length === 1 ? '' : 's'} unlocked
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-2">
                {levelUp.unlocked.map((a) => (
                  <span key={a.id} className="flex flex-col items-center gap-1">
                    <Avatar avatarId={a.id} size={44} />
                    <span className="text-[11px] text-brand-secondary">{a.name}</span>
                  </span>
                ))}
              </div>
              <Link href="/profile?avatars=1" onClick={() => setLevelUp(null)} className="text-sm text-brand-primary hover:underline">
                Choose your avatar →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
