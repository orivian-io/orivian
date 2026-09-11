'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DomainIcon } from '@/lib/domain-icons'

type Section = {
  id: string
  title: string
  slug: string
  course: { slug: string; title: string } | null
}

type ExamQuestion = {
  id: string
  question_text: string
  question_type: 'single' | 'multi'
  choices: { id: string; text: string }[]
}

type ExamResult = {
  scorePercent: number
  passed: boolean
  correctCount: number
  questionCount: number
  passThreshold: number
  results: { questionId: string; correct: boolean; explanation: string | null }[]
}

type Phase = 'loading' | 'intro' | 'exam' | 'results' | 'not-found'

// Full-domain checkpoint: a 20-25 question exam covering every lesson in
// one section (CISSP domain), as opposed to the 10-question mini-exam
// attached to a single lesson. No content_blocks here - just the
// checkpoint questions, fetched/graded through the same /api/exams routes
// as mini-exams, keyed by sectionId instead of lessonId.
export default function DomainCheckpointPage() {
  const params = useParams()
  const router = useRouter()
  const courseSlug = params.courseSlug as string
  const sectionId = params.sectionId as string

  const [phase, setPhase] = useState<Phase>('loading')
  const [section, setSection] = useState<Section | null>(null)

  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [examError, setExamError] = useState('')
  const [result, setResult] = useState<ExamResult | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('sections')
        .select('id, title, slug, courses(slug, title)')
        .eq('id', sectionId)
        .single()

      if (error || !data) {
        setPhase('not-found')
        return
      }

      const course = Array.isArray(data.courses) ? data.courses[0] : data.courses

      setSection({
        id: data.id,
        title: data.title,
        slug: data.slug,
        course: course || null,
      })
      setPhase('intro')
    }

    load()
  }, [sectionId, router])

  const startExam = async () => {
    setPhase('exam')
    setExamError('')
    setSubmitting(false)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const res = await fetch('/api/exams/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sectionId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setExamError(json.error || 'Could not load the checkpoint.')
      setPhase('intro')
      return
    }

    setQuestions(json.questions)
    setAnswers({})
    setResult(null)
  }

  const toggleAnswer = (questionId: string, choiceId: string, questionType: 'single' | 'multi') => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (questionType === 'single') {
        return { ...prev, [questionId]: [choiceId] }
      }
      const next = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId]
      return { ...prev, [questionId]: next }
    })
  }

  const submitExam = async () => {
    setSubmitting(true)
    setExamError('')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const payloadAnswers = questions.map((q) => ({
      questionId: q.id,
      selectedChoiceIds: answers[q.id] || [],
    }))

    const res = await fetch('/api/exams/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sectionId, answers: payloadAnswers }),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setExamError(json.error || 'Could not submit the checkpoint.')
      return
    }

    setResult(json)
    setPhase('results')
  }

  const allAnswered = questions.length > 0 && questions.every((q) => (answers[q.id] || []).length > 0)

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-brand-bg flex items-center justify-center text-brand-secondary text-sm">
        Loading checkpoint…
      </div>
    )
  }

  if (phase === 'not-found' || !section) {
    return (
      <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-brand-secondary text-sm">This checkpoint couldn&apos;t be found.</p>
        <Link href={`/courses/${courseSlug}`} className="text-brand-primary text-sm hover:underline">
          Back to course
        </Link>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-brand-bg overflow-y-auto">
      <div className="max-w-4xl mx-auto min-h-full flex flex-col px-5 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/courses/${section.course?.slug || courseSlug}`}
            className="text-sm text-brand-secondary hover:text-brand-text transition"
          >
            ✕ Exit
          </Link>
          <span className="flex items-center gap-2 text-xs text-brand-secondary uppercase tracking-wide">
            <DomainIcon slug={section.slug} className="w-4 h-4 text-brand-primary/70" />
            {section.title}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary mb-3">Domain Checkpoint</p>
            <h1 className="text-3xl sm:text-4xl font-display font-medium mb-4">{section.title}</h1>
            <p className="text-brand-secondary text-lg max-w-xl mx-auto mb-8">
              A full-length check across everything in this domain, not just one lesson. Answer every question, then
              submit - you&apos;ll need 80% to pass.
            </p>
            {examError && <p className="text-red-500 text-sm mb-4">{examError}</p>}
            <button
              onClick={startExam}
              className="bg-brand-primary text-black px-6 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
            >
              Start checkpoint
            </button>
          </div>
        )}

        {phase === 'exam' && (
          <div className="flex-1 flex flex-col py-4">
            <h1 className="text-xl font-medium mb-1">{section.title}: domain checkpoint</h1>
            <p className="text-sm text-brand-secondary mb-6">
              Answer every question, then submit. You need {questions.length > 0 ? '80%' : '…'} to pass.
            </p>

            {examError && <p className="text-red-500 text-sm mb-4">{examError}</p>}

            <div className="space-y-6 mb-8">
              {questions.map((q, qi) => (
                <div key={q.id} className="rounded-xl bg-brand-surface p-5">
                  <p className="font-medium mb-3">{qi + 1}. {q.question_text}</p>
                  <div className="space-y-2">
                    {q.choices.map((choice) => {
                      const selected = (answers[q.id] || []).includes(choice.id)
                      return (
                        <label
                          key={choice.id}
                          className={`flex items-center gap-2.5 rounded-md border p-2.5 text-sm cursor-pointer transition ${
                            selected
                              ? 'border-brand-primary bg-brand-primary/10'
                              : 'border-brand-muted/30 hover:border-brand-primary/40'
                          }`}
                        >
                          <input
                            type={q.question_type === 'single' ? 'radio' : 'checkbox'}
                            name={q.id}
                            checked={selected}
                            onChange={() => toggleAnswer(q.id, choice.id, q.question_type)}
                            className="accent-[var(--color-brand-primary)]"
                          />
                          {choice.text}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {questions.length > 0 && (
              <button
                onClick={submitExam}
                disabled={!allAnswered || submitting}
                className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition disabled:opacity-40 self-start"
              >
                {submitting ? 'Submitting…' : 'Submit checkpoint'}
              </button>
            )}
          </div>
        )}

        {phase === 'results' && result && (
          <div className="flex-1 flex flex-col py-4">
            <div className="text-center mb-8">
              <p className="text-5xl mb-2">{result.passed ? '✅' : '↻'}</p>
              <h1 className="text-2xl font-medium mb-1">
                {result.passed ? 'Checkpoint passed!' : 'Not quite — try again'}
              </h1>
              <p className="text-brand-secondary text-sm">
                {result.correctCount}/{result.questionCount} correct ({result.scorePercent}%, {result.passThreshold}% required)
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {questions.map((q, qi) => {
                const r = result.results.find((r) => r.questionId === q.id)
                return (
                  <div key={q.id} className="rounded-xl bg-brand-surface p-4">
                    <p className={`text-sm font-medium mb-1 ${r?.correct ? 'text-brand-primary' : 'text-red-500'}`}>
                      {r?.correct ? '✓' : '✗'} {qi + 1}. {q.question_text}
                    </p>
                    {r?.explanation && (
                      <p className="text-sm text-brand-secondary">{r.explanation}</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Link
                href={`/courses/${section.course?.slug || courseSlug}`}
                className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
              >
                Back to course
              </Link>
              {!result.passed && (
                <button
                  onClick={startExam}
                  className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2.5"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}