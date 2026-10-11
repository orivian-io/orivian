'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ActivityMap from '@/components/ActivityMap'
import Avatar from '@/components/Avatar'
import LevelBadge from '@/components/LevelBadge'
import {
  ACTIVE_WINDOW_MS,
  fetchAdminLiveActivity,
  fetchLiveActivity,
  timeAgo,
  type AdminLiveActivity,
  type LiveActivity as LiveData,
  type LivePerson,
} from '@/lib/live'

const REFRESH_MS = 30_000

function regionLabel(key: string | null) {
  if (!key) return '-'
  if (key.startsWith('US-')) return `${key.slice(3)}, United States`
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(key) || key
  } catch {
    return key
  }
}

// Refreshes every 30 seconds while the page is visible.
function usePolling<T>(load: () => Promise<T | null>) {
  const [data, setData] = useState<T | null>(null)
  const [failed, setFailed] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = () =>
      load().then((d) => {
        if (cancelled) return
        if (d) setData(d)
        else setFailed(true)
      })
    run()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') run()
      setTick((t) => t + 1) // keep "x min ago" fresh
    }, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [load])

  return { data, failed }
}

function LiveDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary-light opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-primary-light" />
    </span>
  )
}

function Header({ now, day, week }: { now: number; day: number; week: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-xl font-medium">
        <LiveDot /> Live on Orivian
      </h2>
      <p className="text-sm text-brand-secondary tabular-nums">
        <span className="text-brand-text font-medium">{now}</span> studying now · {day} today · {week} this week
      </p>
    </div>
  )
}

function PersonRow({ p, live }: { p: LivePerson; live: boolean }) {
  return (
    <li className={`flex items-center gap-3 px-4 py-2.5 ${p.is_you ? 'bg-brand-primary/10' : ''}`}>
      <Avatar avatarId={p.avatar} name={p.alias} size={30} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm">
          <span className="truncate">{p.alias}</span>
          <LevelBadge xp={p.total_xp} />
          {p.is_you && <span className="text-xs text-brand-primary">You</span>}
        </p>
        {p.course && <p className="truncate text-xs text-brand-secondary">{p.course}</p>}
      </div>
      <span className={`shrink-0 text-xs tabular-nums ${live ? 'text-brand-primary' : 'text-brand-muted'}`}>
        {live ? 'now' : timeAgo(p.last_seen)}
      </span>
    </li>
  )
}

function PublicView() {
  const { data, failed } = usePolling<LiveData>(fetchLiveActivity)
  if (!data) {
    return failed ? null : <div className="h-64 animate-pulse rounded-xl bg-brand-surface" />
  }
  return (
    <section>
      <Header now={data.totals.now} day={data.totals.day} week={data.totals.week} />
      <div className="mb-4 rounded-xl bg-brand-surface p-3 sm:p-5">
        <ActivityMap regions={data.map} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm text-brand-secondary">Studying now</p>
          <ul className="divide-y divide-brand-muted/10 rounded-xl bg-brand-surface">
            {data.active_now.map((p, i) => (
              <PersonRow key={`${p.alias}-${i}`} p={p} live />
            ))}
            {data.active_hidden > 0 && (
              <li className="px-4 py-2.5 text-xs text-brand-muted">
                + {data.active_hidden} learner{data.active_hidden === 1 ? '' : 's'} studying privately
              </li>
            )}
            {data.active_now.length === 0 && data.active_hidden === 0 && (
              <li className="px-4 py-6 text-center text-sm text-brand-muted">Nobody right now - be the first.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm text-brand-secondary">Recently studied · last 24 hours</p>
          <ul className="divide-y divide-brand-muted/10 rounded-xl bg-brand-surface">
            {data.recent.map((p, i) => (
              <PersonRow key={`${p.alias}-${i}`} p={p} live={false} />
            ))}
            {data.recent_hidden > 0 && (
              <li className="px-4 py-2.5 text-xs text-brand-muted">
                + {data.recent_hidden} more studied privately
              </li>
            )}
            {data.recent.length === 0 && data.recent_hidden === 0 && (
              <li className="px-4 py-6 text-center text-sm text-brand-muted">No one else in the last 24 hours.</li>
            )}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-xs text-brand-muted">
        Learners appear by their alias; locations are shown by US state or country only. You can hide yourself from
        public views on your{' '}
        <Link href="/profile" className="text-brand-primary hover:underline">
          profile
        </Link>
        .
      </p>
    </section>
  )
}

function AdminView() {
  const { data, failed } = usePolling<AdminLiveActivity>(fetchAdminLiveActivity)
  if (!data) {
    return failed ? (
      <p className="text-sm text-brand-secondary">Live activity isn&apos;t available (has migration 0014 been run?).</p>
    ) : (
      <div className="h-64 animate-pulse rounded-xl bg-brand-surface" />
    )
  }
  // Measure "live" against the server's clock at the time of the snapshot.
  const nowMs = new Date(data.generated_at).getTime()
  const isLive = (iso: string) => nowMs - new Date(iso).getTime() <= ACTIVE_WINDOW_MS
  const totals = {
    now: data.people.filter((p) => isLive(p.last_seen)).length,
    day: data.people.filter((p) => nowMs - new Date(p.last_seen).getTime() <= 86_400_000).length,
    week: data.people.length,
  }
  return (
    <section>
      <Header {...totals} />
      <div className="mb-4 rounded-xl border border-brand-muted/20 p-3 sm:p-5">
        <ActivityMap regions={data.map} />
      </div>
      {data.people.length === 0 ? (
        <p className="text-sm text-brand-secondary">No study activity in the last 7 days.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-brand-text">
            <thead>
              <tr className="border-b border-brand-muted/20 text-left text-xs text-brand-secondary">
                <th className="py-2 pr-4 font-normal">Learner</th>
                <th className="py-2 pr-4 font-normal">Alias</th>
                <th className="py-2 pr-4 font-normal">Course</th>
                <th className="py-2 pr-4 font-normal">Location</th>
                <th className="py-2 font-normal text-right">Last active</th>
              </tr>
            </thead>
            <tbody>
              {data.people.map((p, i) => (
                <tr key={`${p.email}-${i}`} className="border-b border-brand-muted/10">
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-2">
                      <Avatar avatarId={p.avatar} name={p.full_name || p.alias} size={24} />
                      <span>
                        {p.full_name || 'No name'}
                        <span className="block text-xs text-brand-muted">{p.email}</span>
                      </span>
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {p.alias || '-'}
                    {!p.public && <span className="ml-2 rounded bg-brand-muted/20 px-1.5 py-0.5 text-[10px] text-brand-secondary">hidden</span>}
                  </td>
                  <td className="py-2 pr-4 text-brand-secondary">{p.course || '-'}</td>
                  <td className="py-2 pr-4 text-brand-secondary">{regionLabel(p.region)}</td>
                  <td className={`py-2 text-right whitespace-nowrap ${isLive(p.last_seen) ? 'text-brand-primary' : 'text-brand-secondary'}`}>
                    {isLive(p.last_seen) ? '● now' : timeAgo(p.last_seen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function LiveActivity({ variant = 'public' }: { variant?: 'public' | 'admin' }) {
  return variant === 'admin' ? <AdminView /> : <PublicView />
}
