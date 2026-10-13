'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckIcon, FlagIcon } from '@/components/Icons'

export type ReportTarget = {
  context: 'lesson' | 'mini_exam' | 'checkpoint' | 'final_exam' | 'results' | 'course'
  courseId?: string | null
  lessonId?: string | null
  sectionId?: string | null
  finalExamId?: string | null
  questionId?: string | null
  blockIndex?: number | null
  snapshot?: string | null
}

const CATEGORIES = [
  { id: 'wrong', label: 'Something is wrong', hint: 'An incorrect fact, answer or explanation' },
  { id: 'unclear', label: 'Hard to understand', hint: 'Confusing, vague or missing context' },
  { id: 'typo', label: 'Typo or formatting', hint: 'Spelling, grammar or layout' },
  { id: 'broken', label: "Something isn't working", hint: 'A button, narration or page misbehaving' },
  { id: 'suggestion', label: 'Suggestion', hint: 'An idea to make this better' },
  { id: 'other', label: 'Other', hint: 'Anything else' },
] as const

type Category = (typeof CATEGORIES)[number]['id']

// "Report a problem" link plus its dialog. Sends straight to the Orivian
// team (see /api/feedback). `variant="link"` is a small inline text link for
// question cards; the default is a quiet button for toolbars.
export default function ReportProblem({
  target,
  label = 'Report a problem',
  variant = 'button',
}: {
  target: ReportTarget
  label?: string
  variant?: 'button' | 'link'
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category | null>(null)
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const isQuestion = !!target.questionId

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && state !== 'sending' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, state])

  useEffect(() => {
    if (state !== 'sent') return
    const id = setTimeout(() => {
      setOpen(false)
      setState('idle')
      setCategory(null)
      setMessage('')
    }, 1800)
    return () => clearTimeout(id)
  }, [state])

  const send = async () => {
    if (!category) {
      setError('Choose what kind of problem it is.')
      return
    }
    setState('sending')
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError('Please log in again to send a report.')
      setState('idle')
      return
    }
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...target, category, message, pagePath: pathname }),
    }).catch(() => null)
    if (res?.ok) {
      setState('sent')
    } else {
      const json = await res?.json().catch(() => null)
      setError(json?.error || "Couldn't send your report. Try again.")
      setState('idle')
    }
  }

  const trigger =
    variant === 'link' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-brand-muted underline-offset-2 transition hover:text-brand-primary hover:underline"
      >
        {label}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-brand-secondary transition hover:text-brand-primary"
      >
        <FlagIcon className="h-3.5 w-3.5" />
        {label}
      </button>
    )

  return (
    <>
      {trigger}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
          onClick={() => state !== 'sending' && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-brand-muted/20 bg-brand-surface-raised p-6 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            {state === 'sent' ? (
              <div className="py-6 text-center">
                <CheckIcon className="mx-auto h-8 w-8 text-brand-success" />
                <h2 className="mt-2 text-xl font-medium">Report sent</h2>
                <p className="mt-1 text-sm text-brand-secondary">Thanks. The Orivian team has it and will take a look.</p>
              </div>
            ) : (
              <>
                <h2 id="report-title" className="text-xl font-medium">
                  {isQuestion ? 'Report this question' : 'Report a problem'}
                </h2>
                <p className="mt-1 text-sm text-brand-secondary">
                  It goes straight to the Orivian team, along with {isQuestion ? 'this question' : 'what’s on your screen'}.
                </p>

                <fieldset className="mt-5">
                  <legend className="sr-only">What kind of problem?</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CATEGORIES.map((c) => (
                      <label
                        key={c.id}
                        className={`cursor-pointer rounded-lg border p-3 transition ${
                          category === c.id ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-muted/30 hover:border-brand-primary/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="report-category"
                          value={c.id}
                          checked={category === c.id}
                          onChange={() => {
                            setCategory(c.id)
                            setError('')
                          }}
                          className="sr-only"
                        />
                        <span className="block text-sm">{c.label}</span>
                        <span className="mt-0.5 block text-xs text-brand-muted">{c.hint}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="mt-4 block text-sm text-brand-secondary" htmlFor="report-message">
                  Details {category === 'other' ? '' : '(optional)'}
                </label>
                <textarea
                  id="report-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder={
                    category === 'wrong'
                      ? 'What’s wrong, and what should it say? A source helps if you have one.'
                      : 'What did you notice?'
                  }
                  className="mt-1.5 w-full resize-none rounded-md border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm leading-relaxed text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-none"
                />

                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={state === 'sending'}
                    className="px-3 py-2 text-sm text-brand-secondary hover:text-brand-text disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={state === 'sending'}
                    className="rounded-md bg-brand-primary px-5 py-2 text-sm font-medium text-black transition hover:bg-brand-primary-light disabled:opacity-50"
                  >
                    {state === 'sending' ? 'Sending…' : 'Send report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
