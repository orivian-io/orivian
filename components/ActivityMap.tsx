'use client'

import { useEffect, useMemo, useState } from 'react'
import { placeName, type MapRegion } from '@/lib/live'

type WorldMap = {
  width: number
  height: number
  countries: { id: string; d: string }[]
  states: { id: string; d: string }[]
  points: Record<string, [number, number]>
  names: Record<string, string>
}

let mapPromise: Promise<WorldMap | null> | null = null
function loadMap() {
  if (!mapPromise) {
    mapPromise = fetch('/geo/world.json')
      .then((r) => (r.ok ? (r.json() as Promise<WorldMap>) : null))
      .catch(() => null)
  }
  return mapPromise
}

const GOLD = '#E4C473'

type Props = {
  regions: MapRegion[]
  // Which period the soft dots cover. Visitors see the last 30 days so the
  // map reflects the whole community, not just this week.
  span?: 'week' | 'month'
  // "panel" sits inside a card with a legend; "hero" is the full-bleed
  // homepage version (lights-at-night glow, no legend).
  variant?: 'panel' | 'hero'
}

// World map of study activity: US learners by state, everyone else by
// country. Bright pulsing dots = studying now; soft dots = studied recently.
export default function ActivityMap({ regions, span = 'week', variant = 'panel' }: Props) {
  const [map, setMap] = useState<WorldMap | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const hero = variant === 'hero'

  useEffect(() => {
    let cancelled = false
    loadMap().then((m) => !cancelled && setMap(m))
    return () => {
      cancelled = true
    }
  }, [])

  const spanCount = (r: MapRegion) => (span === 'month' ? (r.month ?? r.week) : r.week)
  const byKey = useMemo(() => new Map(regions.map((r) => [r.key, r])), [regions])
  const activeCountries = useMemo(() => {
    const set = new Set<string>()
    for (const r of regions) set.add(r.key.startsWith('US-') ? 'US' : r.key)
    return set
  }, [regions])

  if (!map) {
    return <div className={`aspect-[2/1] w-full ${hero ? '' : 'animate-pulse rounded-lg bg-brand-surface-raised/40'}`} />
  }

  const hovered = hover ? byKey.get(hover) : null
  const hoveredPoint = hover ? map.points[hover] : null
  const dots = regions
    .filter((r) => map.points[r.key] && (r.now > 0 || spanCount(r) > 0))
    .sort((a, b) => a.now - b.now || spanCount(a) - spanCount(b)) // draw active-now dots on top

  const land = hero ? '#171B21' : '#1C2025'
  const spanLabel = span === 'month' ? 'this month' : 'this week'

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Map of where learners are studying"
      >
        <defs>
          <radialGradient id="study-glow">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.55" />
            <stop offset="45%" stopColor={GOLD} stopOpacity="0.16" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g>
          {map.countries.map((c, i) => (
            <path
              key={c.id || `x${i}`}
              d={c.d}
              fill={activeCountries.has(c.id) ? 'rgba(193,153,85,0.14)' : land}
              stroke="#0A0C0F"
              strokeWidth={0.5}
            />
          ))}
        </g>
        <g>
          {map.states.map((s) => (
            <path
              key={s.id}
              d={s.d}
              fill={byKey.has(s.id) ? 'rgba(193,153,85,0.24)' : 'transparent'}
              stroke="#0A0C0F"
              strokeWidth={0.35}
            />
          ))}
        </g>
        <g>
          {dots.map((r) => {
            const [x, y] = map.points[r.key]
            const live = r.now > 0
            const count = live ? r.now : spanCount(r)
            const radius = Math.min(9, 2.6 + Math.sqrt(count) * 1.6)
            return (
              <g
                key={r.key}
                onMouseEnter={() => setHover(r.key)}
                onMouseLeave={() => setHover((h) => (h === r.key ? null : h))}
                onFocus={() => setHover(r.key)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${placeName(r.key, map.names)}: ${r.now} studying now, ${spanCount(r)} ${spanLabel}`}
                className="cursor-default outline-none"
              >
                {hero && <circle cx={x} cy={y} r={radius * (live ? 4.5 : 3.2)} fill="url(#study-glow)" />}
                {live && (
                  <circle cx={x} cy={y} r={radius} fill="none" stroke={GOLD} strokeWidth={1.2} className="motion-reduce:hidden">
                    <animate attributeName="r" from={radius} to={radius + 9} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.9" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={live ? GOLD : 'rgba(193,153,85,0.6)'}
                  stroke="#0A0C0F"
                  strokeWidth={1}
                />
                <circle cx={x} cy={y} r={radius + 6} fill="transparent" />
              </g>
            )
          })}
        </g>
      </svg>

      {hovered && hoveredPoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-md border border-brand-muted/30 bg-brand-surface-raised px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${(hoveredPoint[0] / map.width) * 100}%`, top: `${(hoveredPoint[1] / map.height) * 100}%` }}
        >
          <p className="font-medium text-brand-text">{placeName(hovered.key, map.names)}</p>
          <p className="text-brand-secondary tabular-nums">
            {hovered.now > 0 && <span className="text-brand-primary">{hovered.now} studying now, </span>}
            {hovered.day} today, {spanCount(hovered)} {spanLabel}
          </p>
        </div>
      )}

      {!hero && (
        <div className="mt-2 flex items-center justify-end gap-4 text-[11px] text-brand-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E4C473]" /> Studying now
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-primary/60" /> Studied {spanLabel}
          </span>
        </div>
      )}
    </div>
  )
}
