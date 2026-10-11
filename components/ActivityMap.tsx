'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MapRegion } from '@/lib/live'

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

function regionName(key: string, map: WorldMap) {
  if (!key.startsWith('US-')) {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(key) || map.names[key] || key
    } catch {
      return map.names[key] || key
    }
  }
  return map.names[key] || key
}

// World map of study activity: US learners by state, everyone else by
// country. Bright pulsing dots = studying now; soft dots = studied this week.
export default function ActivityMap({ regions }: { regions: MapRegion[] }) {
  const [map, setMap] = useState<WorldMap | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadMap().then((m) => !cancelled && setMap(m))
    return () => {
      cancelled = true
    }
  }, [])

  const byKey = useMemo(() => new Map(regions.map((r) => [r.key, r])), [regions])
  const activeCountries = useMemo(() => {
    const set = new Set<string>()
    for (const r of regions) set.add(r.key.startsWith('US-') ? 'US' : r.key)
    return set
  }, [regions])

  if (!map) {
    return <div className="aspect-[2/1] w-full animate-pulse rounded-lg bg-brand-surface-raised/40" />
  }

  const hovered = hover ? byKey.get(hover) : null
  const hoveredPoint = hover ? map.points[hover] : null
  const dots = regions
    .filter((r) => map.points[r.key])
    .sort((a, b) => a.now - b.now || a.week - b.week) // draw active-now dots on top

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${map.width} ${map.height}`} className="block h-auto w-full" role="img" aria-label="Map of where learners are studying">
        <g>
          {map.countries.map((c, i) => (
            <path
              key={c.id || `x${i}`}
              d={c.d}
              fill={activeCountries.has(c.id) ? 'rgba(193,153,85,0.16)' : '#1C2025'}
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
              fill={byKey.has(s.id) ? 'rgba(193,153,85,0.28)' : 'transparent'}
              stroke="#0A0C0F"
              strokeWidth={0.35}
            />
          ))}
        </g>
        <g>
          {dots.map((r) => {
            const [x, y] = map.points[r.key]
            const count = r.now > 0 ? r.now : r.week
            const radius = Math.min(9, 2.6 + Math.sqrt(count) * 1.6)
            const live = r.now > 0
            return (
              <g
                key={r.key}
                onMouseEnter={() => setHover(r.key)}
                onMouseLeave={() => setHover((h) => (h === r.key ? null : h))}
                onFocus={() => setHover(r.key)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${regionName(r.key, map)}: ${r.now} studying now, ${r.week} this week`}
                className="cursor-default outline-none"
              >
                {live && (
                  <circle cx={x} cy={y} r={radius} fill="none" stroke="#E4C473" strokeWidth={1.2}>
                    <animate attributeName="r" from={radius} to={radius + 9} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.9" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={live ? '#E4C473' : 'rgba(193,153,85,0.55)'}
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
          <p className="font-medium text-brand-text">{regionName(hovered.key, map)}</p>
          <p className="text-brand-secondary tabular-nums">
            {hovered.now > 0 && <span className="text-brand-primary">{hovered.now} studying now · </span>}
            {hovered.day} today · {hovered.week} this week
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-end gap-4 text-[11px] text-brand-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E4C473]" /> Studying now
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-primary/55" /> Studied this week
        </span>
      </div>
    </div>
  )
}
