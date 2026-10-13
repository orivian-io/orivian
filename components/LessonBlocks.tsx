'use client'

import { useState } from 'react'
import type { ContentBlock, Diagram, DiagramItem } from '@/lib/narration'
import { renderInline } from '@/lib/inline-format'

// Lesson slide types beyond plain text: term sets, comparisons, practice
// scenarios, diagrams and worked calculations. All drawn from data in the
// lesson's content_blocks, in Orivian's palette, so every course can use them.

type Rich = Extract<ContentBlock, { type: 'term_set' | 'compare' | 'scenario' | 'diagram' | 'calc' }>

export const RICH_TYPES = ['term_set', 'compare', 'scenario', 'diagram', 'calc'] as const

export function isRichBlock(block: ContentBlock): block is Rich {
  return (RICH_TYPES as readonly string[]).includes(block.type)
}

// Slides that need more room than a paragraph's reading measure.
export function isWideBlock(block: ContentBlock) {
  return block.type === 'compare' || block.type === 'diagram' || block.type === 'calc' || (block.type === 'term_set' && !!block.diagram)
}

export default function RichBlockView({ block }: { block: Rich }) {
  switch (block.type) {
    case 'term_set':
      return <TermSetView block={block} />
    case 'compare':
      return <CompareView block={block} />
    case 'scenario':
      return <ScenarioView block={block} />
    case 'diagram':
      return (
        <div>
          <Eyebrow>At a glance</Eyebrow>
          <h1 className="text-3xl sm:text-4xl font-display font-medium mb-2">{block.heading}</h1>
          {block.caption && <p className="text-base sm:text-lg leading-[1.7] text-brand-secondary mb-6">{renderInline(block.caption)}</p>}
          <DiagramView diagram={block.diagram} />
        </div>
      )
    case 'calc':
      return <AleCalcView block={block} />
  }
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-display italic text-sm text-brand-primary mb-1">{children}</p>
}

// ---------------------------------------------------------------------------
// Term set
// ---------------------------------------------------------------------------

function TermSetView({ block }: { block: Extract<Rich, { type: 'term_set' }> }) {
  const terms = (
    <dl className={`${block.diagram ? '' : block.terms.length > 4 ? 'sm:grid sm:grid-cols-2 sm:gap-x-8' : ''}`}>
      {block.terms.map((t) => (
        <div key={t.term} className="flex gap-3 border-t border-brand-muted/15 py-3">
          {t.mark && (
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand-primary/70 font-display text-[13px] italic text-brand-primary"
              aria-hidden="true"
            >
              {t.mark}
            </span>
          )}
          <div>
            <dt className="font-medium text-brand-primary">{t.term}</dt>
            <dd className="text-base leading-[1.6] text-brand-text">{renderInline(t.short)}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
  return (
    <div>
      <Eyebrow>Key terms at a glance</Eyebrow>
      <h1 className="text-3xl sm:text-4xl font-display font-medium mb-2">{block.heading}</h1>
      {block.intro && <p className="text-base sm:text-lg leading-[1.7] text-brand-secondary mb-5">{renderInline(block.intro)}</p>}
      {block.diagram ? (
        <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,15rem)_1fr]">
          <div className="mx-auto w-full max-w-[15rem]">
            <DiagramView diagram={block.diagram} compact />
          </div>
          {terms}
        </div>
      ) : (
        terms
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function CompareView({ block }: { block: Extract<Rich, { type: 'compare' }> }) {
  return (
    <div>
      <Eyebrow>Side by side</Eyebrow>
      <h1 className="text-3xl sm:text-4xl font-display font-medium mb-2">{block.heading}</h1>
      {block.intro && <p className="text-base sm:text-lg leading-[1.7] text-brand-secondary mb-5">{renderInline(block.intro)}</p>}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[34rem] border-collapse text-[15px]">
          <thead>
            <tr>
              <th className="w-[24%] border-b border-brand-muted/30 py-2 pr-3" />
              {block.columns.map((c) => (
                <th key={c} scope="col" className="border-b border-brand-muted/30 px-3 py-2 text-left font-display text-base font-normal italic text-brand-primary">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="border-b border-brand-muted/15 py-2.5 pr-3 text-left align-top text-sm font-normal text-brand-secondary">
                  {renderInline(r.label)}
                </th>
                {r.values.map((v, i) => (
                  <td key={i} className="border-b border-brand-muted/15 px-3 py-2.5 align-top leading-[1.55] text-brand-text">
                    {renderInline(v)}
                  </td>
                ))}
              </tr>
            ))}
            {block.cue && (
              <tr>
                <th scope="row" className="py-2.5 pr-3 text-left align-top font-display text-sm font-normal italic text-brand-primary">
                  Exam cue
                </th>
                {block.cue.map((c, i) => (
                  <td key={i} className="px-3 py-2.5 align-top text-sm leading-[1.55] text-brand-secondary">
                    {renderInline(c)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Practice scenario (ungraded)
// ---------------------------------------------------------------------------

function ScenarioView({ block }: { block: Extract<Rich, { type: 'scenario' }> }) {
  const [picked, setPicked] = useState<string | null>(null)
  const revealed = picked !== null
  return (
    <div>
      <Eyebrow>How this shows up on the exam</Eyebrow>
      <div className="rounded-xl bg-brand-surface p-5 sm:p-6 mb-4">
        <p className="text-lg sm:text-xl leading-[1.6] text-brand-text">{renderInline(block.prompt)}</p>
      </div>
      <div className="space-y-2" role="group" aria-label="Answer choices">
        {block.choices.map((c) => {
          const isAnswer = c.id === block.answer
          const isPicked = c.id === picked
          let cls = 'border-brand-muted/30 hover:border-brand-primary/50'
          if (revealed && isAnswer) cls = 'border-brand-success/70 bg-brand-success/10'
          else if (revealed && isPicked) cls = 'border-brand-alert/70 bg-brand-alert/10'
          else if (revealed) cls = 'border-brand-muted/20 opacity-70'
          return (
            <button
              key={c.id}
              type="button"
              disabled={revealed}
              onClick={() => setPicked(c.id)}
              className={`flex w-full items-start justify-between gap-3 rounded-lg border px-4 py-3 text-left text-base transition disabled:cursor-default ${cls}`}
            >
              <span>{renderInline(c.text)}</span>
              {revealed && isAnswer && <span className="shrink-0 text-sm text-brand-success">{isPicked ? 'Your answer · correct' : 'Correct answer'}</span>}
              {revealed && isPicked && !isAnswer && <span className="shrink-0 text-sm text-brand-alert">Your answer</span>}
            </button>
          )
        })}
      </div>
      {revealed ? (
        <div className="mt-5 space-y-2 text-base leading-[1.65]" aria-live="polite">
          <p>
            <span className="font-display italic text-brand-success">Why: </span>
            {renderInline(block.why)}
          </p>
          {block.trap && (
            <p>
              <span className="font-display italic text-brand-alert">The trap: </span>
              {renderInline(block.trap)}
            </p>
          )}
          <button type="button" onClick={() => setPicked(null)} className="pt-1 text-sm text-brand-secondary hover:text-brand-primary">
            Try again
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-brand-muted">Practice only, not scored. Pick an answer to see the reasoning.</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Worked calculation: SLE / ALE
// ---------------------------------------------------------------------------

const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '-'

function AleCalcView({ block }: { block: Extract<Rich, { type: 'calc' }> }) {
  const d = block.defaults ?? { assetValue: 200000, exposureFactor: 25, aro: 0.5 }
  const [av, setAv] = useState(String(d.assetValue))
  const [ef, setEf] = useState(String(d.exposureFactor))
  const [aro, setAro] = useState(String(d.aro))
  const sle = (Number(av) || 0) * ((Number(ef) || 0) / 100)
  const ale = sle * (Number(aro) || 0)
  const field = (label: string, hint: string, value: string, set: (v: string) => void, suffix?: string, prefix?: string) => (
    <label className="block">
      <span className="block text-sm text-brand-text">{label}</span>
      <span className="block text-xs text-brand-secondary mb-1">{hint}</span>
      <span className="flex items-center rounded-md border border-brand-muted/40 bg-brand-bg focus-within:border-brand-primary">
        {prefix && <span className="pl-3 text-sm text-brand-secondary">{prefix}</span>}
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => set(e.target.value.replace(/[^0-9.]/g, ''))}
          className="w-full bg-transparent px-3 py-2 tabular-nums text-brand-text outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-brand-secondary">{suffix}</span>}
      </span>
    </label>
  )
  return (
    <div>
      <Eyebrow>Work it out</Eyebrow>
      <h1 className="text-3xl sm:text-4xl font-display font-medium mb-2">{block.heading}</h1>
      {block.intro && <p className="text-base sm:text-lg leading-[1.7] text-brand-secondary mb-5">{renderInline(block.intro)}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {field('Asset value (AV)', 'What the asset is worth', av, setAv, undefined, '$')}
        {field('Exposure factor (EF)', 'Share lost in one incident', ef, setEf, '%')}
        {field('Annual rate (ARO)', 'Times per year (0.25 = once in 4 years)', aro, setAro, '/yr')}
      </div>
      <div className="mt-6 space-y-3 rounded-xl bg-brand-surface p-5">
        <p className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm text-brand-secondary">
            <span className="font-display italic text-brand-primary">SLE</span> = AV × EF = {money(Number(av) || 0)} × {Number(ef) || 0}%
          </span>
          <span className="font-display text-2xl tabular-nums">{money(sle)}</span>
        </p>
        <p className="flex flex-wrap items-baseline justify-between gap-2 border-t border-brand-muted/15 pt-3">
          <span className="text-sm text-brand-secondary">
            <span className="font-display italic text-brand-primary">ALE</span> = SLE × ARO = {money(sle)} × {Number(aro) || 0}
          </span>
          <span className="font-display text-3xl tabular-nums text-brand-primary">{money(ale)}</span>
        </p>
      </div>
      <p className="mt-4 text-sm text-brand-secondary leading-[1.6]">
        A control is worth buying when its yearly cost is less than the ALE it removes:{' '}
        <span className="text-brand-text">ALE before − ALE after − yearly cost of the control</span> is the value of the safeguard.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Diagrams
// ---------------------------------------------------------------------------

const GOLD = 'var(--color-brand-primary)'
const MUTED = 'var(--color-brand-muted)'

export function DiagramView({ diagram, compact = false }: { diagram: Diagram; compact?: boolean }) {
  switch (diagram.kind) {
    case 'triad':
      return <Triad d={diagram} compact={compact} />
    case 'pyramid':
      return <Pyramid d={diagram} />
    case 'flow':
      return <Flow steps={diagram.steps} />
    case 'cycle':
      return <Cycle d={diagram} />
    case 'ladder':
      return <Ladder d={diagram} />
    case 'timeline':
      return <Timeline d={diagram} />
    default:
      return null
  }
}

function Triad({ d, compact }: { d: Extract<Diagram, { kind: 'triad' }>; compact: boolean }) {
  // Vertices: top, bottom-left, bottom-right (C, I, A reading order).
  const v = [
    { x: 120, y: 26 },
    { x: 26, y: 188 },
    { x: 214, y: 188 },
  ]
  return (
    <figure>
      <svg viewBox="0 0 240 230" className="h-auto w-full" role="img" aria-label={d.points.map((p) => p.label).join(', ')}>
        <path d={`M${v[0].x} ${v[0].y} L${v[1].x} ${v[1].y} L${v[2].x} ${v[2].y} Z`} fill={GOLD} fillOpacity="0.06" stroke={GOLD} strokeWidth="1.5" />
        {d.center && (
          <text x="120" y="140" textAnchor="middle" fontSize="12" fill="var(--color-brand-secondary)">
            {d.center}
          </text>
        )}
        {d.points.map((p, i) => (
          <g key={p.label}>
            <circle cx={v[i].x} cy={v[i].y} r="17" fill="var(--color-brand-bg)" stroke={GOLD} strokeWidth="1.5" />
            <text x={v[i].x} y={v[i].y + 5} textAnchor="middle" fontSize="16" fontStyle="italic" fill={GOLD} className="font-display">
              {p.label.charAt(0)}
            </text>
            {!compact && (
              <text x={v[i].x} y={i === 0 ? v[i].y - 24 : v[i].y + 34} textAnchor="middle" fontSize="13" fill="var(--color-brand-text)">
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  )
}

function Pyramid({ d }: { d: Extract<Diagram, { kind: 'pyramid' }> }) {
  const n = d.tiers.length
  const W = 430
  const CX = W / 2
  const tierH = 44
  const gap = 4
  const H = n * (tierH + gap)
  const base = 210 // half-width at the bottom of the last tier
  const halfAt = (y: number) => (base * y) / H
  return (
    <figure>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-6">
        <svg viewBox={`0 0 ${W} ${H + 6}`} className="h-auto w-full sm:max-w-[30rem]" role="img" aria-label={d.tiers.map((t) => t.label).join(', ')}>
          {d.tiers.map((t, i) => {
            const y0 = i * (tierH + gap)
            const y1 = y0 + tierH
            const a = i === 0 ? 0 : halfAt(y0)
            const b = halfAt(y1)
            const fillOpacity = t.muted ? 0 : 0.24 - i * (0.18 / Math.max(1, n - 1))
            return (
              <g key={t.label}>
                <path
                  d={`M${CX - a} ${y0} L${CX + a} ${y0} L${CX + b} ${y1} L${CX - b} ${y1} Z`}
                  fill={GOLD}
                  fillOpacity={Math.max(0.04, fillOpacity)}
                  stroke={t.muted ? MUTED : GOLD}
                  strokeDasharray={t.muted ? '4 4' : undefined}
                  strokeWidth="1.25"
                />
                <text
                  x={CX}
                  y={y1 - (i === 0 ? 10 : 17)}
                  textAnchor="middle"
                  fontSize="15"
                  fontStyle={t.muted ? 'italic' : undefined}
                  fill={t.muted ? 'var(--color-brand-secondary)' : 'var(--color-brand-text)'}
                  className="font-display"
                >
                  {t.label}
                </text>
              </g>
            )
          })}
        </svg>
        {(d.top || d.bottom) && (
          <div className="flex justify-between text-xs text-brand-secondary sm:flex-col sm:py-1 sm:text-sm">
            <span>{d.top && `↑ ${d.top}`}</span>
            <span>{d.bottom && `↓ ${d.bottom}`}</span>
          </div>
        )}
      </div>
      {d.tiers.some((t) => t.note) && <ItemNotes items={d.tiers} />}
    </figure>
  )
}

// Label + note pairs under a diagram. Stacks on phones.
function ItemNotes({ items, labelWidth }: { items: (DiagramItem | undefined)[]; labelWidth?: string }) {
  return (
    <dl className="mt-4 space-y-2 text-sm">
      {items.map((t) =>
        t?.note ? (
          <div key={t.label} className="flex flex-col sm:flex-row sm:gap-2">
            <dt className={`shrink-0 ${labelWidth ?? ''} ${t.muted ? 'italic text-brand-secondary' : 'text-brand-primary'}`}>{t.label}</dt>
            <dd className="text-brand-text/85">{renderInline(t.note)}</dd>
          </div>
        ) : null,
      )}
    </dl>
  )
}

function Flow({ steps }: { steps: DiagramItem[] }) {
  const box = (s: DiagramItem, i: number) => (
    <div className={`h-full rounded-lg border px-3 py-3 ${s.muted ? 'border-dashed border-brand-muted/50' : 'border-brand-primary/40 bg-brand-primary/[0.06]'}`}>
      <p className="font-display text-xs italic text-brand-primary">{i + 1}</p>
      <p className="font-medium leading-snug">{s.label}</p>
      {s.note && <p className="mt-1 text-sm leading-snug text-brand-secondary">{renderInline(s.note)}</p>}
    </div>
  )
  // Long sequences wrap into a numbered grid instead of one cramped row.
  if (steps.length > 4) {
    return (
      <ol className={`grid gap-2 grid-cols-1 sm:grid-cols-3 ${steps.length > 6 ? 'lg:grid-cols-4' : ''}`}>
        {steps.map((s, i) => (
          <li key={s.label} className="min-w-0">
            {box(s, i)}
          </li>
        ))}
      </ol>
    )
  }
  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
      {steps.map((s, i) => (
        <li key={s.label} className="flex min-w-0 flex-col sm:flex-1 sm:basis-0 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1">{box(s, i)}</div>
          {i < steps.length - 1 && (
            <span className="self-center px-1.5 py-0.5 text-brand-muted sm:py-0" aria-hidden="true">
              <span className="sm:hidden">↓</span>
              <span className="hidden sm:inline">›</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

function Cycle({ d }: { d: Extract<Diagram, { kind: 'cycle' }> }) {
  const n = d.steps.length
  const C = 170
  const R = 108
  const pts = d.steps.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a), a }
  })
  // Short arcs between neighbouring nodes, each ending in an arrowhead.
  const arc = (i: number) => {
    const a0 = pts[i].a + 0.32
    const a1 = pts[(i + 1) % n].a - 0.32 + (i === n - 1 ? 2 * Math.PI : 0)
    const p0 = { x: C + R * Math.cos(a0), y: C + R * Math.sin(a0) }
    const p1 = { x: C + R * Math.cos(a1), y: C + R * Math.sin(a1) }
    return `M${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A${R} ${R} 0 0 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
  }
  return (
    <figure className="grid items-center gap-6 sm:grid-cols-[minmax(0,17rem)_1fr]">
      <svg viewBox="0 0 340 340" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label={d.steps.map((s) => s.label).join(', then ')}>
        <defs>
          <marker id="cycle-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9z" fill={GOLD} />
          </marker>
        </defs>
        {pts.map((_, i) => (
          <path key={i} d={arc(i)} fill="none" stroke={GOLD} strokeOpacity="0.55" strokeWidth="1.5" markerEnd="url(#cycle-arrow)" />
        ))}
        {pts.map((p, i) => (
          <g key={d.steps[i].label}>
            <circle cx={p.x} cy={p.y} r="17" fill="var(--color-brand-bg)" stroke={GOLD} strokeWidth="1.5" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="15" fontStyle="italic" fill={GOLD} className="font-display">
              {i + 1}
            </text>
          </g>
        ))}
        {d.center && (
          <text x={C} y={C + 5} textAnchor="middle" fontSize="13" fill="var(--color-brand-secondary)" className="font-display" fontStyle="italic">
            {d.center}
          </text>
        )}
      </svg>
      <ol className="space-y-2">
        {d.steps.map((s, i) => (
          <li key={s.label} className="flex gap-3">
            <span className="w-5 shrink-0 font-display italic text-brand-primary">{i + 1}</span>
            <span>
              <span className="font-medium">{s.label}</span>
              {s.note && <span className="block text-sm text-brand-secondary leading-snug">{renderInline(s.note)}</span>}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  )
}

function Ladder({ d }: { d: Extract<Diagram, { kind: 'ladder' }> }) {
  return (
    <figure>
      {d.top && <p className="mb-2 text-xs text-brand-secondary">↑ {d.top}</p>}
      <ol className="relative space-y-2 border-l border-brand-primary/40 pl-5">
        {d.rungs.map((r, i) => (
          <li key={r.label} className="relative">
            <span
              className="absolute -left-[1.95rem] top-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-brand-primary bg-brand-bg font-display text-[13px] italic text-brand-primary"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div className="rounded-lg bg-brand-surface px-4 py-2.5" style={{ opacity: 1 - i * 0.08 }}>
              <p className="font-medium leading-snug">{renderInline(r.label)}</p>
              {r.note && <p className="mt-0.5 text-sm leading-snug text-brand-secondary">{renderInline(r.note)}</p>}
            </div>
          </li>
        ))}
      </ol>
      {d.bottom && <p className="mt-2 text-xs text-brand-secondary">↓ {d.bottom}</p>}
    </figure>
  )
}

function Timeline({ d }: { d: Extract<Diagram, { kind: 'timeline' }> }) {
  const W = 560
  const axisY = 118
  const left = 20
  const eventX = d.before ? 170 : 60
  const right = W - 20
  const span = (right - eventX) / Math.max(1, d.after.length)
  const label = (x: number, y: number, item: DiagramItem, color: string, anchor: 'middle' | 'start' = 'middle') => (
    <text x={x} y={y} textAnchor={anchor} fontSize="13" fill={color} className="font-display" fontStyle="italic">
      {item.label}
    </text>
  )
  return (
    <figure>
      <svg viewBox={`0 0 ${W} 170`} className="h-auto w-full" role="img" aria-label="Timeline">
        <defs>
          <marker id="tl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9z" fill="var(--color-brand-secondary)" />
          </marker>
        </defs>
        <line x1={left} y1={axisY} x2={right} y2={axisY} stroke={MUTED} strokeWidth="1.25" markerEnd="url(#tl-arrow)" />
        <text x={right} y={axisY + 18} textAnchor="end" fontSize="11" fill="var(--color-brand-secondary)">
          time
        </text>

        {d.before && (
          <g>
            <rect x={left + 10} y={axisY - 20} width={eventX - left - 10} height="20" rx="3" fill="var(--color-brand-alert)" fillOpacity="0.18" stroke="var(--color-brand-alert)" strokeOpacity="0.7" />
            {label((left + 10 + eventX) / 2, axisY - 28, d.before, 'var(--color-brand-alert)')}
            <text x={left + 10} y={axisY + 18} fontSize="11" fill="var(--color-brand-secondary)">
              last good backup
            </text>
          </g>
        )}

        {d.after.map((a, i) => {
          const x0 = eventX + i * span
          return (
            <g key={a.label}>
              <rect x={x0 + 2} y={axisY - 20} width={span - 4} height="20" rx="3" fill={GOLD} fillOpacity={0.22 - i * 0.08} stroke={GOLD} strokeOpacity="0.7" />
              {label(x0 + span / 2, axisY - 28, a, GOLD)}
            </g>
          )
        })}

        {d.total && (
          <g>
            <path d={`M${eventX} 44 L${eventX} 36 L${right} 36 L${right} 44`} fill="none" stroke="var(--color-brand-success)" strokeWidth="1.25" />
            {label((eventX + right) / 2, 28, d.total, 'var(--color-brand-success)')}
          </g>
        )}

        <line x1={eventX} y1={axisY - 50} x2={eventX} y2={axisY + 8} stroke="var(--color-brand-alert)" strokeWidth="2" />
        <text x={eventX} y={axisY + 34} textAnchor="middle" fontSize="12" fill="var(--color-brand-text)">
          {d.event}
        </text>
      </svg>
      <ItemNotes items={[d.before, ...d.after, d.total]} labelWidth="sm:w-14 font-display italic" />
    </figure>
  )
}
