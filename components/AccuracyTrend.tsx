'use client'

import { useMemo, useState } from 'react'

type Day = { day: string; answered: number; correct: number }

function shiftDay(ymd: string, delta: number) {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

function shortDate(ymd: string) {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

// Daily answer accuracy for the last 30 days, one bar per day. Days with no
// questions answered show no bar. The dashed line marks the 80% pass mark.
export default function AccuracyTrend({ daily, today }: { daily: Day[]; today: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const byDay = useMemo(() => new Map(daily.map((d) => [d.day, d])), [daily])
  const days = Array.from({ length: 30 }, (_, i) => shiftDay(today, i - 29))
  const rows = days.map((day) => {
    const d = byDay.get(day)
    return { day, answered: d?.answered ?? 0, correct: d?.correct ?? 0, pct: d && d.answered ? Math.round((d.correct / d.answered) * 100) : null }
  })
  const hovered = hover !== null ? rows[hover] : null

  return (
    <div>
      <div className="relative h-44 pl-9">
        {/* Gridlines */}
        {[100, 50, 0].map((v) => (
          <div key={v} className="absolute left-9 right-0 border-t border-brand-muted/15" style={{ bottom: `${v}%` }}>
            <span className="absolute -left-9 -translate-y-1/2 text-[11px] text-brand-muted tabular-nums">{v}%</span>
          </div>
        ))}
        <div className="absolute left-9 right-0 border-t border-dashed border-brand-secondary/50" style={{ bottom: '80%' }}>
          <span className="absolute -left-9 -translate-y-1/2 text-[11px] text-brand-secondary tabular-nums">80%</span>
        </div>

        <div className="absolute inset-0 left-9 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {rows.map((r, i) => (
            <div
              key={r.day}
              className="relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              tabIndex={r.pct !== null ? 0 : -1}
              aria-label={r.pct !== null ? `${shortDate(r.day)}: ${r.pct}% (${r.correct} of ${r.answered})` : undefined}
            >
              {r.pct !== null && (
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-brand-primary-light' : 'bg-brand-primary'}`}
                  style={{ height: `${Math.max(r.pct, 2)}%` }}
                />
              )}
            </div>
          ))}
        </div>

        {hovered && hovered.pct !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-brand-muted/30 bg-brand-surface-raised px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `calc(2.25rem + (100% - 2.25rem) * ${(hover! + 0.5) / 30})` }}
          >
            <span className="text-brand-secondary">{shortDate(hovered.day)}</span>
            <span className="ml-2 font-medium text-brand-text tabular-nums">{hovered.pct}%</span>
            <span className="ml-1 text-brand-secondary tabular-nums">
              ({hovered.correct}/{hovered.answered})
            </span>
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between pl-9 text-[11px] text-brand-muted">
        <span>{shortDate(days[0])}</span>
        <span>Today</span>
      </div>
    </div>
  )
}
