'use client'

import { useState } from 'react'
import { formatStudyTime, shiftDay, type StudyDay, type StudyWeek } from '@/lib/study-time'

function shortDate(ymd: string) {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function weekday(ymd: string) {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })
}

// Picks a tidy y-axis top (in minutes) a little above the busiest bar.
function niceMaxMinutes(maxSeconds: number) {
  const minutes = maxSeconds / 60
  const steps = [15, 30, 60, 90, 120, 180, 240, 360, 480, 600, 900, 1200, 1800, 2400, 3000, 3600]
  return steps.find((s) => s >= minutes) ?? Math.ceil(minutes / 600) * 600
}

function axisLabel(minutes: number) {
  if (minutes === 0) return '0'
  if (minutes < 60) return `${minutes}m`
  const h = minutes / 60
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
}

type Bar = { key: string; seconds: number; label: string; tip: string; isCurrent: boolean }

// Study time as bars - one per day (last 14 days) or per week (last 12
// weeks). Hover or focus a bar for its exact time.
export default function StudyTimeChart({ days, weeks, today }: { days: StudyDay[]; weeks: StudyWeek[]; today: string }) {
  const [mode, setMode] = useState<'day' | 'week'>('day')
  const [hover, setHover] = useState<number | null>(null)

  const bars: Bar[] =
    mode === 'day'
      ? days.slice(-14).map((d) => ({
          key: d.day,
          seconds: d.seconds,
          label: d.day === today ? 'Today' : weekday(d.day),
          tip: `${d.day === today ? 'Today' : `${weekday(d.day)}, ${shortDate(d.day)}`}`,
          isCurrent: d.day === today,
        }))
      : weeks.map((w, i) => ({
          key: w.weekStart,
          seconds: w.seconds,
          label: i === weeks.length - 1 ? 'This wk' : shortDate(w.weekStart),
          tip: i === weeks.length - 1 ? 'This week' : `Week of ${shortDate(w.weekStart)} – ${shortDate(shiftDay(w.weekStart, 6))}`,
          isCurrent: i === weeks.length - 1,
        }))

  const top = niceMaxMinutes(Math.max(60, ...bars.map((b) => b.seconds)))
  const hovered = hover !== null ? bars[hover] : null
  // Show every label for weeks/2-week view on wide screens; thin on mobile.
  const labelEvery = mode === 'day' ? 2 : 3

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-brand-secondary">
          {mode === 'day' ? 'Daily study time · last 14 days' : 'Weekly study time · last 12 weeks'}
        </p>
        <div className="flex gap-1 rounded-lg bg-brand-bg p-1 text-xs" role="tablist" aria-label="Group by">
          {(['day', 'week'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m)
                setHover(null)
              }}
              className={`rounded-md px-2.5 py-1 transition ${mode === m ? 'bg-brand-primary text-black font-medium' : 'text-brand-secondary hover:text-brand-text'}`}
            >
              {m === 'day' ? 'Days' : 'Weeks'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-44 pl-9">
        {[1, 0.5, 0].map((f) => (
          <div key={f} className="absolute left-9 right-0 border-t border-brand-muted/15" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -left-9 -translate-y-1/2 text-[11px] text-brand-muted tabular-nums">{axisLabel(top * f)}</span>
          </div>
        ))}

        <div className="absolute inset-0 left-9 flex items-end gap-1" onMouseLeave={() => setHover(null)}>
          {bars.map((b, i) => (
            <div
              key={b.key}
              className="relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${b.tip}: ${formatStudyTime(b.seconds)}`}
            >
              {b.seconds > 0 && (
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${
                    hover === i ? 'bg-brand-primary-light' : b.isCurrent ? 'bg-brand-primary' : 'bg-brand-primary/70'
                  }`}
                  style={{ height: `${Math.max((b.seconds / 60 / top) * 100, 2)}%` }}
                />
              )}
            </div>
          ))}
        </div>

        {hovered && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-brand-muted/30 bg-brand-surface-raised px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `calc(2.25rem + (100% - 2.25rem) * ${(hover! + 0.5) / bars.length})` }}
          >
            <span className="text-brand-secondary">{hovered.tip}</span>
            <span className="ml-2 font-medium text-brand-text tabular-nums">{formatStudyTime(hovered.seconds)}</span>
          </div>
        )}
      </div>

      <div className="mt-1.5 flex gap-1 pl-9 text-[11px] text-brand-muted">
        {bars.map((b, i) => (
          <span key={b.key} className={`flex-1 text-center truncate ${b.isCurrent ? 'text-brand-secondary' : ''}`}>
            {i % labelEvery === (bars.length - 1) % labelEvery ? b.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
