'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'

// The course drawn as a trail up a ridge. Every lesson, recap and
// checkpoint is a waypoint; each domain is one climb that tops out at a
// summit marker. Walked ground is sage, the next waypoint is gold, steps
// tried but not passed are ember, and the trail ahead is dotted.

export type TrailStep = {
  key: string
  title: string
  href: string
  kind: 'lesson' | 'recap' | 'checkpoint'
  done: boolean
  started: boolean
  failed: boolean
}

export type TrailStage = { id: string; title: string; steps: TrailStep[] }

const W = 1000
const H = 260
const PAD_X = 28
const BASE_Y = 222 // trailhead height
const CLIMB = 150 // total rise across the course
const DIP = 0.55 // how far (in domain-heights) each saddle drops

type Pt = { x: number; y: number }

export default function TrailMap({ stages, nextKey }: { stages: TrailStage[]; nextKey: string | null }) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  const layout = useMemo(() => {
    const flat: { step: TrailStep; stage: number; t: number }[] = []
    const stageRanges: { start: number; end: number; count: number }[] = []
    const total = stages.reduce((n, s) => n + s.steps.length, 0)
    let i = 0
    stages.forEach((s, si) => {
      const start = i
      s.steps.forEach((step) => {
        flat.push({ step, stage: si, t: (i + 0.5) / total })
        i++
      })
      stageRanges.push({ start: start / total, end: i / total, count: s.steps.length })
    })

    // Height of the ridge at t. Every domain is one climb of equal height
    // (long domains climb more gently), easing onto a shoulder where its
    // summit flag stands, then dipping slightly into the next climb.
    const yAt = (t: number) => {
      const si = Math.max(0, stageRanges.findIndex((sr) => t >= sr.start && t <= sr.end))
      const r = stageRanges[si]
      const u = r && r.end > r.start ? (t - r.start) / (r.end - r.start) : 0
      const ease = u * u * (3 - 2 * u)
      const saddle = si === 0 ? 0 : Math.sin(Math.PI * Math.min(1, u * 2.2)) * DIP
      const level = (si + ease - saddle) / Math.max(1, stages.length)
      return BASE_Y - CLIMB * level
    }
    const at = (t: number): Pt => ({ x: PAD_X + t * (W - PAD_X * 2), y: yAt(t) })

    const samples: Pt[] = Array.from({ length: 501 }, (_, k) => at(k / 500))
    const line = (pts: Pt[]) => pts.map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

    // Solid trail behind each finished waypoint (from the previous one).
    const walked = flat
      .map((f, k) => {
        if (!f.step.done) return null
        const t0 = k === 0 ? 0 : flat[k - 1].t
        const pts = samples.filter((_, j) => j / 500 >= t0 && j / 500 <= f.t)
        pts.unshift(at(t0))
        pts.push(at(f.t))
        return line(pts)
      })
      .filter((d): d is string => !!d)

    const summits = stageRanges.map((r, si) => {
      return { ...at(r.end), stage: si }
    })

    // Far range: a fixed jagged skyline, scaled to sit behind the trail.
    const peaks = [0, 0.35, 0.2, 0.55, 0.4, 0.75, 0.5, 0.9, 0.62, 1, 0.7, 0.85, 0.6]
    const farRange =
      `M0 ${H} ` +
      peaks.map((p, k) => `L${((k / (peaks.length - 1)) * W).toFixed(0)} ${(BASE_Y - 30 - p * (CLIMB + 10)).toFixed(0)}`).join(' ') +
      ` L${W} ${H} Z`

    return {
      farRange,
      waypoints: flat.map((f) => ({ ...f, ...at(f.t) })),
      ridge: line(samples),
      ground: `${line(samples)} L${W - PAD_X} ${H} L${PAD_X} ${H} Z`,
      walked,
      summits,
    }
  }, [stages])

  const next = layout.waypoints.find((w) => w.step.key === nextKey) ?? null

  // On narrow screens the map scrolls sideways - start it at the next waypoint.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !next || el.scrollWidth <= el.clientWidth) return
    el.scrollLeft = (next.x / W) * el.scrollWidth - el.clientWidth / 2
  }, [next])

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    router.push(href)
  }

  const label = next ? (next.step.title.length > 34 ? `${next.step.title.slice(0, 33)}…` : next.step.title) : ''
  const labelAnchor = next ? (next.x < 160 ? 'start' : next.x > W - 160 ? 'end' : 'middle') : 'middle'

  return (
    <div ref={scrollRef} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full min-w-[720px]" role="img" aria-label="Course trail map">
        <defs>
          <linearGradient id="trail-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.07" />
            <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trail-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-muted)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--color-brand-muted)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trail-fade-x" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="8%" stopColor="#fff" stopOpacity="1" />
            <stop offset="92%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="trail-fade">
            <rect width={W} height={H} fill="url(#trail-fade-x)" />
          </mask>
        </defs>

        {/* A far ridge for depth */}
        <g mask="url(#trail-fade)">
          <path d={layout.farRange} fill="url(#trail-far)" />
          <path d={layout.ground} fill="url(#trail-ground)" />
        </g>

        {/* The faint trail ahead */}
        <path d={layout.ridge} fill="none" stroke="var(--color-brand-muted)" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="1.5 5" strokeLinecap="round" />

        {/* Ground already covered */}
        {layout.walked.map((d, k) => (
          <path key={k} d={d} fill="none" stroke="var(--color-brand-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Domain summits */}
        {layout.summits.map((s) => {
          const stage = stages[s.stage]
          const complete = stage.steps.every((x) => x.done)
          const color = complete ? 'var(--color-brand-success)' : 'var(--color-brand-muted)'
          return (
            <g key={stage.id}>
              <title>{`${stage.title}${complete ? ' - complete' : ''}`}</title>
              <line x1={s.x} y1={s.y - 9} x2={s.x} y2={s.y - 30} stroke={color} strokeWidth="1.25" />
              <path d={`M${s.x} ${s.y - 30} l10 3.5 -10 3.5z`} fill={color} />
              <text
                x={s.x}
                y={s.y - 36}
                textAnchor="middle"
                className="font-display"
                fontSize="13"
                fontStyle="italic"
                fill={complete ? 'var(--color-brand-success)' : 'var(--color-brand-secondary)'}
              >
                {stageNumber(stage.title, s.stage)}
              </text>
            </g>
          )
        })}

        {/* Waypoints */}
        {layout.waypoints.map((w) => {
          const isNext = w.step.key === nextKey
          const { done, failed, started, kind } = w.step
          const r = kind === 'checkpoint' ? 4.5 : 3.25
          let fill = 'var(--color-brand-bg)'
          let stroke = 'var(--color-brand-muted)'
          if (done) fill = stroke = 'var(--color-brand-success)'
          else if (failed) fill = stroke = 'var(--color-brand-alert)'
          else if (started) {
            fill = 'var(--color-brand-bg)'
            stroke = 'var(--color-brand-primary)'
          }
          const status = done ? 'done' : failed ? 'not passed yet' : isNext ? 'next' : started ? 'in progress' : 'not started'
          return (
            <a key={w.step.key} href={w.step.href} onClick={go(w.step.href)} className="cursor-pointer outline-none focus-visible:[&>circle:last-child]:stroke-brand-primary-light">
              <title>{`${w.step.title} (${status})`}</title>
              <circle cx={w.x} cy={w.y} r="9" fill="transparent" />
              {kind === 'checkpoint' ? (
                <rect
                  x={w.x - r}
                  y={w.y - r}
                  width={r * 2}
                  height={r * 2}
                  transform={`rotate(45 ${w.x} ${w.y})`}
                  fill={isNext ? 'var(--color-brand-primary)' : fill}
                  stroke={isNext ? 'var(--color-brand-primary)' : stroke}
                  strokeWidth="1.25"
                />
              ) : (
                <circle
                  cx={w.x}
                  cy={w.y}
                  r={isNext ? 5 : r}
                  fill={isNext ? 'var(--color-brand-primary)' : fill}
                  stroke={isNext ? 'var(--color-brand-primary)' : stroke}
                  strokeWidth="1.25"
                />
              )}
            </a>
          )
        })}

        {/* Next waypoint marker */}
        {next && (
          <g pointerEvents="none">
            <circle cx={next.x} cy={next.y} r="11" fill="none" stroke="var(--color-brand-primary)" strokeOpacity="0.5" className="motion-safe:animate-pulse" />
            <line x1={next.x} y1={next.y + 12} x2={next.x} y2={Math.min(H - 22, next.y + 34)} stroke="var(--color-brand-primary)" strokeOpacity="0.5" strokeDasharray="2 3" />
            <text
              x={next.x}
              y={Math.min(H - 8, next.y + 48)}
              textAnchor={labelAnchor}
              fontSize="13"
              fill="var(--color-brand-primary)"
            >
              <tspan className="font-display" fontStyle="italic">Next: </tspan>
              <tspan fill="var(--color-brand-text)">{label}</tspan>
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

// "Domain 3: Security Architecture" -> "3"; otherwise the stage's position.
function stageNumber(title: string, index: number) {
  const m = title.match(/(\d+)/)
  return m ? m[1] : String(index + 1)
}
