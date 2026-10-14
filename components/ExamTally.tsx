'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Attempt = { attempt_type: string; score_percent: number; passed: boolean }
type Tally = { perfect: number; passed: number; failed: number }

const TYPES: { key: string; label: string }[] = [
  { key: 'mini_exam', label: 'Lesson exams' },
  { key: 'section_exam', label: 'Domain checkpoints' },
  { key: 'final_exam', label: 'Practice exams' },
]

function tally(rows: Attempt[]): Tally {
  const t = { perfect: 0, passed: 0, failed: 0 }
  for (const r of rows) {
    if (Number(r.score_percent) >= 100) t.perfect++
    else if (r.passed) t.passed++
    else t.failed++
  }
  return t
}

// Every exam result the learner has on record, bucketed as perfect (100%),
// passed (below 100%) and not passed - overall and per exam type. Reads the
// learner's own attempts (RLS: own rows only). A progress reset clears the
// attempts it resets, so these counts follow it.
export default function ExamTally({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Attempt[] | null>(null)

  useEffect(() => {
    supabase
      .from('exam_attempts')
      .select('attempt_type, score_percent, passed')
      .eq('user_id', userId)
      .in('attempt_type', TYPES.map((t) => t.key))
      .then(({ data }) => setRows((data ?? []) as Attempt[]))
  }, [userId])

  if (!rows) return null

  const all = tally(rows)
  const total = rows.length
  const passRate = total ? Math.round(((all.perfect + all.passed) / total) * 100) : null

  return (
    <section className="mb-12">
      <h2 className="text-xl font-medium mb-1">Exam results</h2>
      <p className="text-sm text-brand-secondary mb-4">
        {total
          ? `${total.toLocaleString()} exam${total === 1 ? '' : 's'} taken · ${passRate}% passed`
          : 'Every lesson exam, checkpoint and practice exam you take is tallied here.'}
      </p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <ResultTile value={all.perfect} label="Perfect scores" sub="100%" tone="text-brand-primary" ring="border-brand-primary/40 bg-brand-primary/10" />
        <ResultTile value={all.passed} label="Passed" sub="below 100%" tone="text-brand-success" />
        <ResultTile value={all.failed} label="Not passed" sub="under the pass line" tone="text-brand-alert" />
      </div>
      {total > 0 && (
        <div className="overflow-x-auto rounded-xl bg-brand-surface">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-xs text-brand-secondary">
                <th className="px-4 py-3 text-left font-normal">Exam type</th>
                <th className="px-3 py-3 text-right font-normal">Perfect</th>
                <th className="px-3 py-3 text-right font-normal">Passed</th>
                <th className="px-3 py-3 text-right font-normal">Not passed</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {TYPES.map((type) => {
                const sub = rows.filter((r) => r.attempt_type === type.key)
                const t = tally(sub)
                return (
                  <tr key={type.key} className="border-t border-brand-muted/15">
                    <td className="px-4 py-3">{type.label}</td>
                    <td className="px-3 py-3 text-right text-brand-primary">{t.perfect}</td>
                    <td className="px-3 py-3 text-right text-brand-success">{t.passed}</td>
                    <td className="px-3 py-3 text-right text-brand-alert">{t.failed}</td>
                    <td className="px-4 py-3 text-right text-brand-secondary">{sub.length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function ResultTile({ value, label, sub, tone, ring }: { value: number; label: string; sub: string; tone: string; ring?: string }) {
  return (
    <div className={`rounded-xl p-4 sm:p-5 ${ring ? `border ${ring}` : 'bg-brand-surface'}`}>
      <p className={`font-display text-3xl sm:text-4xl tabular-nums ${tone}`}>{value.toLocaleString()}</p>
      <p className="text-sm text-brand-text mt-1">{label}</p>
      <p className="text-xs text-brand-secondary">{sub}</p>
    </div>
  )
}
