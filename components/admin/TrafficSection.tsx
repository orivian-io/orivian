'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ActivityMap from '@/components/ActivityMap'
import { NO_TRACK_KEY } from '@/components/PageViewTracker'
import type { MapRegion } from '@/lib/live'

type Traffic = {
  generated_at: string
  days: number
  totals: {
    visitors: number
    visitors_prev: number
    views: number
    views_prev: number
    signed_in_visitors: number
    single_page_visitors: number
    now: number
  }
  daily: { day: string; visitors: number; views: number; signups: number }[]
  pages: { path: string; views: number; visitors: number }[]
  landing: { path: string; visitors: number }[]
  referrers: { source: string; visitors: number }[]
  campaigns: { source: string; visitors: number }[]
  devices: { device: string; visitors: number }[]
  places: MapRegion[]
  funnel: { visitors: number; signups: number; started: number; first_lesson: number; via_invite: number }
}

const RANGES = [7, 30, 90] as const

const PAGE_NAMES: Record<string, string> = {
  '/': 'Homepage',
  '/courses': 'Courses',
  '/signup': 'Sign up',
  '/login': 'Log in',
  '/dashboard': 'Signed-in home',
  '/invite': 'Invite links',
  '/friends': 'Friends',
  '/profile': 'Profile',
  '/stats': 'Stats',
  '/notes': 'Notes',
  '/live': 'Live',
}

function pageName(path: string) {
  if (PAGE_NAMES[path]) return PAGE_NAMES[path]
  if (path.startsWith('/courses/')) return `Course: ${path.slice(9)}`
  if (path.startsWith('/learn/')) return `Lessons: ${path.slice(7)}`
  return path
}

function change(now: number, prev: number) {
  if (prev === 0) return now > 0 ? 'new' : null
  const pct = Math.round(((now - prev) / prev) * 100)
  return `${pct >= 0 ? '+' : ''}${pct}% vs previous period`
}

function share(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function BarList({ rows, label }: { rows: { name: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="text-sm text-brand-secondary">No data yet.</p>
  return (
    <ul className="space-y-2" aria-label={label}>
      {rows.map((r) => (
        <li key={r.name} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-3 py-1.5 text-sm">
          <span className="absolute inset-y-0 left-0 rounded-md bg-brand-primary/15" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden="true" />
          <span className="relative min-w-0 truncate">{r.name}</span>
          <span className="relative shrink-0 tabular-nums text-brand-secondary">{r.value.toLocaleString()}</span>
        </li>
      ))}
    </ul>
  )
}

export default function TrafficSection() {
  const [days, setDays] = useState<number>(30)
  const [data, setData] = useState<Traffic | null>(null)
  const [failed, setFailed] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  // Leave the admin's own browsing out of the numbers unless they opt in.
  // (Only rendered in the browser, after the admin check.)
  const [countMe, setCountMe] = useState(() => {
    try {
      if (localStorage.getItem(NO_TRACK_KEY) === null) localStorage.setItem(NO_TRACK_KEY, '1')
      return localStorage.getItem(NO_TRACK_KEY) !== '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) return
      const res = await fetch(`/api/admin/traffic?days=${days}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => null)
      const json = res?.ok ? ((await res.json().catch(() => null)) as Traffic | null) : null
      if (cancelled) return
      if (json) {
        setData(json)
        setFailed(false)
      } else setFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [days])

  const toggleCountMe = (on: boolean) => {
    setCountMe(on)
    try {
      localStorage.setItem(NO_TRACK_KEY, on ? '0' : '1')
    } catch {
      /* storage unavailable */
    }
  }

  const header = (
    <div id="traffic" className="mb-4 flex scroll-mt-24 flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-medium">Traffic</h2>
        <p className="mt-1 text-sm text-brand-secondary">
          Everyone who visits the site, signed in or not. Visitors are counted once per day; no IP addresses are stored.
        </p>
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-brand-surface p-1" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setDays(r)}
            aria-pressed={days === r}
            className={`rounded-md px-3 py-1 text-sm ${days === r ? 'bg-brand-primary font-medium text-black' : 'text-brand-secondary hover:text-brand-text'}`}
          >
            {r} days
          </button>
        ))}
      </div>
    </div>
  )

  if (!data) {
    return (
      <section className="mb-14">
        {header}
        {failed ? (
          <p className="rounded-lg border border-brand-muted/30 p-4 text-sm text-brand-secondary">
            Traffic couldn&apos;t load. Has migration 0018 been run in Supabase?
          </p>
        ) : (
          <div className="h-48 animate-pulse rounded-xl bg-brand-surface" />
        )}
      </section>
    )
  }

  const t = data.totals
  const f = data.funnel
  const max = Math.max(1, ...data.daily.map((d) => d.visitors))
  const h = hover !== null ? data.daily[hover] : null
  const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const steps = [
    { label: 'Visitors (not signed in)', value: f.visitors },
    { label: 'Signed up', value: f.signups },
    { label: 'Started studying', value: f.started },
    { label: 'Finished a first lesson', value: f.first_lesson },
  ]

  return (
    <section className="mb-14">
      {header}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 rounded-xl bg-brand-surface p-6 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <dt className="text-xs text-brand-secondary">Visitors</dt>
          <dd className="mt-1 text-2xl tabular-nums">{t.visitors.toLocaleString()}</dd>
          <dd className="text-xs text-brand-muted">{change(t.visitors, t.visitors_prev)}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-secondary">Page views</dt>
          <dd className="mt-1 text-2xl tabular-nums">{t.views.toLocaleString()}</dd>
          <dd className="text-xs text-brand-muted">{change(t.views, t.views_prev)}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-secondary">On the site now</dt>
          <dd className="mt-1 text-2xl tabular-nums">{t.now}</dd>
          <dd className="text-xs text-brand-muted">Last 5 minutes</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-secondary">Pages per visitor</dt>
          <dd className="mt-1 text-2xl tabular-nums">{t.visitors ? (t.views / t.visitors).toFixed(1) : '0'}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-secondary">Left after one page</dt>
          <dd className="mt-1 text-2xl tabular-nums">{share(t.single_page_visitors, t.visitors)}%</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-secondary">Signed in</dt>
          <dd className="mt-1 text-2xl tabular-nums">{share(t.signed_in_visitors, t.visitors)}%</dd>
          <dd className="text-xs text-brand-muted">of visitors</dd>
        </div>
      </dl>

      <figure className="mt-4 rounded-xl bg-brand-surface p-5">
        <figcaption className="mb-3 flex items-baseline justify-between gap-3 text-sm">
          <span>Visitors per day</span>
          <span className="text-xs text-brand-secondary tabular-nums">
            {h ? `${dayLabel(h.day)}: ${h.visitors} visitors, ${h.views} views, ${h.signups} signups` : `Last ${data.days} days`}
          </span>
        </figcaption>
        <div className="flex h-32 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {data.daily.map((d, i) => (
            <div key={d.day} className="flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
              <div
                className={`w-full rounded-t-[3px] ${hover === i ? 'bg-brand-primary-light' : 'bg-brand-primary/70'}`}
                style={{ height: d.visitors > 0 ? `${Math.max(3, (d.visitors / max) * 100)}%` : '1px', opacity: d.visitors > 0 ? 1 : 0.25 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-brand-muted">
          <span>{data.daily[0] && dayLabel(data.daily[0].day)}</span>
          <span>Today</span>
        </div>
      </figure>

      <div className="mt-4 rounded-xl bg-brand-surface p-6">
        <h3 className="mb-4 font-medium">From visit to learner</h3>
        <ol className="grid gap-3 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.label} className="rounded-lg bg-brand-bg/50 p-4">
              <p className="text-xs text-brand-secondary">{s.label}</p>
              <p className="mt-1 text-2xl tabular-nums">{s.value.toLocaleString()}</p>
              {i > 0 && (
                <p className="mt-0.5 text-xs text-brand-muted">{share(s.value, steps[i - 1].value)}% of the step before</p>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-brand-muted">
          Signups and the steps after count accounts created in this period; {f.via_invite} came through an invite link.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-brand-surface p-6">
          <h3 className="mb-3 font-medium">Where visitors come from</h3>
          <BarList label="Referrers" rows={data.referrers.map((r) => ({ name: r.source.replace(/^www\./, ''), value: r.visitors }))} />
          {data.campaigns.length > 0 && (
            <>
              <h4 className="mb-2 mt-5 text-sm text-brand-secondary">Campaign links (utm_source)</h4>
              <BarList label="Campaigns" rows={data.campaigns.map((r) => ({ name: r.source, value: r.visitors }))} />
            </>
          )}
        </div>
        <div className="rounded-xl bg-brand-surface p-6">
          <h3 className="mb-3 font-medium">Where they land</h3>
          <BarList label="Landing pages" rows={data.landing.map((r) => ({ name: pageName(r.path), value: r.visitors }))} />
          <h4 className="mb-2 mt-5 text-sm text-brand-secondary">Devices</h4>
          <BarList
            label="Devices"
            rows={data.devices.map((r) => ({ name: r.device.charAt(0).toUpperCase() + r.device.slice(1), value: r.visitors }))}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl bg-brand-surface p-4 sm:p-5">
          <h3 className="mb-3 font-medium">Where visitors are</h3>
          <ActivityMap regions={data.places} span="month" kind="visit" />
        </div>
        <div className="rounded-xl bg-brand-surface p-6">
          <h3 className="mb-3 font-medium">Most visited pages</h3>
          <table className="w-full text-sm text-brand-text">
            <thead>
              <tr className="text-left text-xs text-brand-secondary">
                <th className="py-1.5 pr-3 font-normal">Page</th>
                <th className="py-1.5 pr-3 text-right font-normal">Visitors</th>
                <th className="py-1.5 text-right font-normal">Views</th>
              </tr>
            </thead>
            <tbody>
              {data.pages.map((p) => (
                <tr key={p.path} className="border-t border-brand-muted/10">
                  <td className="max-w-0 truncate py-1.5 pr-3" title={p.path}>
                    {pageName(p.path)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{p.visitors}</td>
                  <td className="py-1.5 text-right tabular-nums text-brand-secondary">{p.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-brand-secondary">
        <input type="checkbox" checked={countMe} onChange={(e) => toggleCountMe(e.target.checked)} className="h-4 w-4 accent-[#C19955]" />
        Count my own visits from this browser
      </label>
    </section>
  )
}
