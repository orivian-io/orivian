'use client'

import { useMemo, useState } from 'react'
import type { DayActivity } from '@/lib/stats'
import { FlameIcon } from '@/components/Icons'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// Month view of study activity. A day lights up when at least one lesson
// was completed (the streak rule); deeper gold means more lessons.
export default function StreakCalendar({ days, today }: { days: DayActivity[]; today: string }) {
  const byDay = useMemo(() => new Map(days.map((d) => [d.day, d])), [days])
  const [ty, tm] = today.split('-').map(Number)
  const [view, setView] = useState({ year: ty, month: tm }) // month is 1-12

  const first = new Date(Date.UTC(view.year, view.month - 1, 1))
  const daysInMonth = new Date(Date.UTC(view.year, view.month, 0)).getUTCDate()
  const leading = first.getUTCDay()
  const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${view.year}-${pad(view.month)}-${pad(i + 1)}`),
  ]

  const activeDays = cells.filter((d) => d && (byDay.get(d)?.lessons ?? 0) > 0).length
  const isCurrentMonth = view.year === ty && view.month === tm
  const earliest = days.reduce<string | null>((min, d) => (min === null || d.day < min ? d.day : min), null)
  const canGoBack = earliest ? `${view.year}-${pad(view.month)}` > earliest.slice(0, 7) : false

  const shift = (delta: number) =>
    setView((v) => {
      const m = v.month + delta
      return m < 1 ? { year: v.year - 1, month: 12 } : m > 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: m }
    })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          className="rounded px-2 py-1 text-brand-secondary hover:text-brand-text disabled:opacity-20"
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-medium">{monthLabel}</p>
          <p className="text-xs text-brand-secondary">
            {activeDays} active day{activeDays === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={isCurrentMonth}
          className="rounded px-2 py-1 text-brand-secondary hover:text-brand-text disabled:opacity-20"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="pb-1 text-[11px] text-brand-muted">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const act = byDay.get(d)
          const lessons = act?.lessons ?? 0
          const isToday = d === today
          const future = d > today
          const level = lessons === 0 ? '' : lessons === 1 ? 'bg-brand-primary/35' : lessons === 2 ? 'bg-brand-primary/60' : 'bg-brand-primary/90 text-black'
          const label = new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
          return (
            <span
              key={d}
              title={
                future
                  ? label
                  : `${label}: ${lessons ? `${lessons} lesson${lessons === 1 ? '' : 's'} completed` : 'no lessons'}${act?.xp ? ` · ${act.xp} XP` : ''}`
              }
              className={`relative flex aspect-square items-center justify-center rounded-md text-xs tabular-nums ${
                level || (future ? 'text-brand-muted/40' : 'bg-brand-bg/60 text-brand-secondary')
              } ${isToday ? 'ring-1 ring-brand-primary ring-offset-1 ring-offset-brand-surface-raised' : ''}`}
            >
              {Number(d.slice(8))}
              {lessons > 0 && <FlameIcon className="absolute -right-1 -top-1.5 h-2.5 w-2.5 text-brand-primary" />}
            </span>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-brand-muted">
        <span>Fewer</span>
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-bg/60" />
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-primary/35" />
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-primary/60" />
        <span className="h-2.5 w-2.5 rounded-sm bg-brand-primary/90" />
        <span>More lessons</span>
      </div>
    </div>
  )
}
