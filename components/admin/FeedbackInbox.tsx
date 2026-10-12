'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/live'

type Status = 'new' | 'reviewing' | 'fixed' | 'wont_fix'

type Report = {
  id: string
  created_at: string
  context: string
  category: string
  message: string | null
  snapshot: string | null
  block_index: number | null
  page_path: string | null
  status: Status
  admin_note: string | null
  emailed: boolean
  courses: { title: string; slug: string } | null
  lessons: { title: string } | null
  sections: { title: string } | null
  final_exam_title: string | null
  reporter: { full_name: string | null; email: string | null; display_name: string | null } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  wrong: 'Something is wrong',
  unclear: 'Hard to understand',
  typo: 'Typo or formatting',
  broken: "Something isn't working",
  suggestion: 'Suggestion',
  other: 'Other',
}
const CONTEXT_LABELS: Record<string, string> = {
  lesson: 'Lesson slide',
  mini_exam: 'Mini-exam question',
  checkpoint: 'Checkpoint question',
  final_exam: 'Practice exam question',
  results: 'Results explanation',
  course: 'Course',
}
const STATUS_LABELS: Record<Status, string> = { new: 'New', reviewing: 'Reviewing', fixed: 'Fixed', wont_fix: "Won't fix" }

export const FEEDBACK_CHANGED = 'orivian:feedback-changed'

async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

function ReportCard({ r, onChange }: { r: Report; onChange: () => void }) {
  const [note, setNote] = useState(r.admin_note || '')
  const [saving, setSaving] = useState(false)

  const update = async (patch: { status?: Status; admin_note?: string }) => {
    setSaving(true)
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ id: r.id, ...patch }),
    }).catch(() => null)
    setSaving(false)
    window.dispatchEvent(new Event(FEEDBACK_CHANGED))
    onChange()
  }

  const where = [r.courses?.title, r.sections?.title, r.lessons?.title, r.final_exam_title].filter(Boolean).join(' › ')

  return (
    <li className={`rounded-xl p-5 ${r.status === 'new' ? 'border border-brand-primary/35 bg-brand-surface' : 'bg-brand-surface'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {CATEGORY_LABELS[r.category] || r.category}
            <span className="ml-2 text-sm font-normal text-brand-secondary">
              {CONTEXT_LABELS[r.context] || r.context}
              {r.block_index !== null ? `, slide ${r.block_index + 1}` : ''}
            </span>
          </p>
          {where && <p className="mt-0.5 text-sm text-brand-secondary">{where}</p>}
        </div>
        <span className="shrink-0 text-xs text-brand-muted">{timeAgo(r.created_at)}</span>
      </div>

      {r.message && <p className="mt-3 whitespace-pre-wrap text-sm">{r.message}</p>}
      {r.snapshot && (
        <blockquote className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap border-l-2 border-brand-muted/40 pl-3 text-sm text-brand-secondary">
          {r.snapshot}
        </blockquote>
      )}

      <p className="mt-3 text-xs text-brand-muted">
        From {r.reporter?.full_name || r.reporter?.display_name || 'a learner'}
        {r.reporter?.email && (
          <>
            {' '}
            (<a href={`mailto:${r.reporter.email}`} className="hover:text-brand-primary">{r.reporter.email}</a>)
          </>
        )}
        {r.page_path && (
          <>
            {' · '}
            <a href={r.page_path} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">
              Open page
            </a>
          </>
        )}
        {!r.emailed && ' · not emailed'}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-brand-muted/15 pt-4">
        {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            disabled={saving}
            onClick={() => update({ status: s })}
            aria-pressed={r.status === s}
            className={`rounded-full px-3 py-1 text-xs transition ${
              r.status === s ? 'bg-brand-primary font-medium text-black' : 'border border-brand-muted/30 text-brand-secondary hover:text-brand-text'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== (r.admin_note || '') && update({ admin_note: note })}
          placeholder="Private note (saved when you click away)"
          className="ml-auto min-w-0 flex-1 rounded-md border border-brand-muted/30 bg-brand-bg px-3 py-1.5 text-xs focus:border-brand-primary focus:outline-none sm:max-w-xs"
        />
      </div>
    </li>
  )
}

export default function FeedbackInbox() {
  const [show, setShow] = useState<'open' | 'all'>('open')
  const [data, setData] = useState<{ open: number; rows: Report[] } | null>(null)
  const [failed, setFailed] = useState(false)

  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let cancelled = false
    authHeader()
      .then((headers) => fetch(`/api/admin/feedback?status=${show}`, { headers }))
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((json) => {
        if (cancelled) return
        if (json) {
          setData(json)
          setFailed(false)
        } else setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [show, reloadKey])

  return (
    <section className="mb-14">
      <div id="feedback" className="mb-4 flex scroll-mt-24 flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium">
            Feedback {data && data.open > 0 && <span className="text-brand-primary">({data.open} open)</span>}
          </h2>
          <p className="mt-1 text-sm text-brand-secondary">Problems learners reported from lessons, questions, exams and results.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-brand-surface p-1" role="group" aria-label="Which reports">
          {(['open', 'all'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setShow(v)}
              aria-pressed={show === v}
              className={`rounded-md px-3 py-1 text-sm ${show === v ? 'bg-brand-primary font-medium text-black' : 'text-brand-secondary hover:text-brand-text'}`}
            >
              {v === 'open' ? 'Open' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {failed ? (
        <p className="rounded-lg border border-brand-muted/30 p-4 text-sm text-brand-secondary">
          Feedback couldn&apos;t load. Has migration 0019 been run in Supabase?
        </p>
      ) : !data ? (
        <div className="h-32 animate-pulse rounded-xl bg-brand-surface" />
      ) : data.rows.length === 0 ? (
        <p className="rounded-xl bg-brand-surface p-6 text-sm text-brand-secondary">
          {show === 'open' ? 'No open reports. Nice.' : 'No reports yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {data.rows.map((r) => (
            <ReportCard key={r.id} r={r} onChange={reload} />
          ))}
        </ul>
      )}
    </section>
  )
}
