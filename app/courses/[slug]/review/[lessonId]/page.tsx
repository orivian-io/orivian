'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AnswerChoices from '@/components/AnswerChoices'

type ReviewAnswer = {
  questionId: string
  questionText: string
  questionType: 'single' | 'multi'
  choices: { id: string; text: string }[]
  selectedChoiceIds: string[]
  correctChoiceIds: string[]
  correct: boolean
  explanation: string | null
}

type Attempt = {
  id: string
  scorePercent: number
  passed: boolean
  questionCount: number
  completedAt: string
  answers: ReviewAnswer[]
}

type ReviewData = {
  lesson: { id: string; title: string; course: { slug: string; title: string } | null }
  attempts: Attempt[]
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Lets a learner go back over any of their past mini-exam attempts for a
// lesson: what they picked, the correct answer, and the explanation.
export default function ExamReviewPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const lessonId = params.lessonId as string

  const [data, setData] = useState<ReviewData | null>(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [missedOnly, setMissedOnly] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      try {
        const res = await fetch('/api/exams/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ lessonId }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json) {
          setError(json?.error || 'Could not load your attempts.')
          return
        }
        setData(json)
        const first = (json as ReviewData).attempts[0]
        if (first) {
          setSelectedId(first.id)
          // Nothing to filter on a perfect score - show everything.
          if (first.answers.every((a) => a.correct)) setMissedOnly(false)
        }
      } catch {
        setError('Could not load your attempts. Check your connection and try again.')
      }
    }
    load()
  }, [lessonId, router])

  const backHref = `/courses/${data?.lesson.course?.slug || slug}`

  if (error) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-4">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <Link href={backHref} className="text-sm text-brand-primary hover:underline">← Back to course</Link>
      </main>
    )
  }

  if (!data) {
    return <main className="max-w-3xl mx-auto py-12 px-4 text-sm text-brand-secondary">Loading your attempts…</main>
  }

  const attempt = data.attempts.find((a) => a.id === selectedId) ?? null
  const missedCount = attempt ? attempt.answers.filter((a) => !a.correct).length : 0
  const shown = attempt ? attempt.answers.filter((a) => !missedOnly || !a.correct) : []

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <Link href={backHref} className="text-sm text-brand-secondary hover:text-brand-text transition">
        ← {data.lesson.course?.title || 'Back to course'}
      </Link>

      <h1 className="text-3xl font-display font-medium mt-4 mb-1">{data.lesson.title}</h1>
      <p className="text-brand-secondary mb-8">Review your mini-exam attempts</p>

      {data.attempts.length === 0 ? (
        <div className="rounded-xl bg-brand-surface p-6 text-sm text-brand-secondary">
          You haven&apos;t taken this lesson&apos;s mini-exam yet.{' '}
          <Link href={`/learn/${slug}/${lessonId}`} className="text-brand-primary hover:underline">
            Start the lesson →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1" role="tablist" aria-label="Attempts">
            {data.attempts.map((a, i) => {
              const selected = a.id === selectedId
              return (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setSelectedId(a.id)}
                  className={`shrink-0 rounded-lg border px-3.5 py-2 text-left transition ${
                    selected
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-brand-muted/25 hover:border-brand-muted/60'
                  }`}
                >
                  <span className={`block text-sm font-medium tabular-nums ${a.passed ? 'text-brand-primary' : 'text-red-400'}`}>
                    {a.passed ? '✓' : '✗'} {Math.round(a.scorePercent)}%
                  </span>
                  <span className="block text-xs text-brand-secondary whitespace-nowrap">
                    {i === 0 ? 'Latest · ' : ''}{formatWhen(a.completedAt)}
                  </span>
                </button>
              )
            })}
          </div>

          {attempt && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <p className="text-sm text-brand-secondary">
                  {attempt.answers.length - missedCount} of {attempt.answers.length} correct
                  {missedCount > 0 ? ` · ${missedCount} missed` : ' · perfect score'}
                </p>
                {missedCount > 0 && (
                  <div className="flex rounded-md border border-brand-muted/25 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setMissedOnly(true)}
                      className={`rounded px-2.5 py-1 transition ${missedOnly ? 'bg-brand-primary text-black font-medium' : 'text-brand-secondary hover:text-brand-text'}`}
                    >
                      Missed only
                    </button>
                    <button
                      type="button"
                      onClick={() => setMissedOnly(false)}
                      className={`rounded px-2.5 py-1 transition ${!missedOnly ? 'bg-brand-primary text-black font-medium' : 'text-brand-secondary hover:text-brand-text'}`}
                    >
                      All questions
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {shown.map((q) => (
                  <div
                    key={q.questionId}
                    className={`rounded-xl bg-brand-surface p-5 border-l-2 ${q.correct ? 'border-brand-primary' : 'border-red-500'}`}
                  >
                    <p className="font-medium mb-3">
                      <span className={q.correct ? 'text-brand-primary' : 'text-red-400'}>{q.correct ? '✓' : '✗'}</span>{' '}
                      {q.questionText}
                    </p>
                    <AnswerChoices
                      choices={q.choices}
                      selectedChoiceIds={q.selectedChoiceIds}
                      correctChoiceIds={q.correctChoiceIds}
                    />
                    {q.explanation && <p className="text-sm text-brand-secondary">{q.explanation}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`/learn/${slug}/${lessonId}?retake=1`}
              className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
            >
              ↻ Retake exam
            </Link>
            <Link
              href={`/learn/${slug}/${lessonId}`}
              className="border border-brand-primary/50 text-brand-primary px-4 py-2.5 rounded-md text-sm hover:bg-brand-primary/10 transition"
            >
              Review the lesson
            </Link>
            <Link href={backHref} className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2.5">
              Back to course
            </Link>
          </div>
        </>
      )}
    </main>
  )
}
