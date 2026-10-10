'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DomainIcon } from '@/lib/domain-icons'
import { formatDuration } from '@/lib/format-duration'

type FinalExam = {
  id: string
  title: string
  description: string | null
  time_limit_minutes: number
  question_count: number
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
  elapsedSeconds: number
  timeLimitSeconds: number
  withinTimeLimit: boolean
  scoringDisclaimer: string
  results: { questionId: string; correct: boolean; explanation: string | null }[]
}

type SavedProgress = {
  startedAt: string
  timeLimitMinutes: number
  questions: ExamQuestion[]
  answers: Record<string, string[]>
}

type Phase = 'loading' | 'intro' | 'exam' | 'results' | 'not-found'

function storageKey(examId: string, userId: string) {
  return `orivian-final-exam:${examId}:${userId}`
}

// Full-length practice exam: shared across every course. Question count,
// domain weighting, and time limit are all per-exam data (final_exams.*),
// not hardcoded here - e.g. CISSP runs 125 questions over 3 hours, Security+
// runs 90 over 90 minutes. Unlike a lesson mini-exam or Domain Checkpoint,
// going over the time limit never blocks submission - the timer is
// informational, and the result screen just notes whether the attempt
// finished within it.
// Progress (answers + the server-issued start time) is saved to
// localStorage so a refresh mid-exam doesn't lose hours of work; it's
// cleared once the attempt is submitted.
export default function FinalExamPage() {
  const params = useParams()
  const router = useRouter()
  const courseSlug = params.courseSlug as string
  const examId = params.examId as string

  const [phase, setPhase] = useState<Phase>('loading')
  const [exam, setExam] = useState<FinalExam | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(180)
  const [hasSavedProgress, setHasSavedProgress] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [examError, setExamError] = useState('')
  const [result, setResult] = useState<ExamResult | null>(null)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data, error } = await supabase
        .from('final_exams')
        .select('id, title, description, time_limit_minutes, question_count, courses(slug, title)')
        .eq('id', examId)
        .single()

      if (error || !data) {
        setPhase('not-found')
        return
      }

      const course = Array.isArray(data.courses) ? data.courses[0] : data.courses

      setExam({
        id: data.id,
        title: data.title,
        description: data.description,
        time_limit_minutes: data.time_limit_minutes,
        question_count: data.question_count,
        course: course || null,
      })
      // timeLimitMinutes starts at a hardcoded default (see useState below)
      // and is otherwise only set once the exam actually starts - without
      // this, the intro screen shows that default instead of this exam's
      // real time limit for every course whose limit isn't 180 minutes.
      setTimeLimitMinutes(data.time_limit_minutes)

      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(examId, user.id)) : null
      if (raw) {
        try {
          const saved: SavedProgress = JSON.parse(raw)
          if (saved?.startedAt && Array.isArray(saved.questions) && saved.questions.length > 0) {
            setHasSavedProgress(true)
          }
        } catch {
          // Corrupt/old saved state - ignore, treat as no saved progress.
        }
      }

      setPhase('intro')
    }

    load()
  }, [examId, router])

  // Live-ticking elapsed timer while the exam is in progress. Purely
  // client-side display - the server recomputes the true elapsed time from
  // `startedAt` at submit, so a few seconds of drift here doesn't matter.
  useEffect(() => {
    if (phase !== 'exam' || !startedAt) {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      return
    }

    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000))
      setElapsedSeconds(elapsed)
    }
    tick()
    tickRef.current = setInterval(tick, 1000)

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [phase, startedAt])

  const persistProgress = (nextAnswers: Record<string, string[]>, startedAtValue: string, questionsValue: ExamQuestion[], limitMinutes: number) => {
    if (!userId || typeof window === 'undefined') return
    const payload: SavedProgress = {
      startedAt: startedAtValue,
      timeLimitMinutes: limitMinutes,
      questions: questionsValue,
      answers: nextAnswers,
    }
    try {
      window.localStorage.setItem(storageKey(examId, userId), JSON.stringify(payload))
    } catch {
      // Best-effort - a full/blocked localStorage just means no resume
      // safety net, not a reason to interrupt the exam.
    }
  }

  const clearProgress = () => {
    if (!userId || typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(storageKey(examId, userId))
    } catch {
      // Ignore.
    }
  }

  const resumeExam = () => {
    if (!userId || typeof window === 'undefined') return
    const raw = window.localStorage.getItem(storageKey(examId, userId))
    if (!raw) return
    try {
      const saved: SavedProgress = JSON.parse(raw)
      setQuestions(saved.questions)
      setAnswers(saved.answers || {})
      setStartedAt(saved.startedAt)
      setTimeLimitMinutes(saved.timeLimitMinutes || 180)
      setResult(null)
      setExamError('')
      setPhase('exam')
    } catch {
      setExamError('Your saved progress for this exam looks corrupted - starting over instead.')
      clearProgress()
      setHasSavedProgress(false)
    }
  }

  const startExam = async (fresh: boolean) => {
    if (fresh) clearProgress()
    setPhase('exam')
    setExamError('')
    setSubmitting(false)
    setResult(null)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const res = await fetch('/api/final-exams/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ examId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setExamError(json.error || 'Could not load the exam.')
      setPhase('intro')
      return
    }

    setQuestions(json.questions)
    setAnswers({})
    setStartedAt(json.startedAt)
    setTimeLimitMinutes(json.timeLimitMinutes)
    setHasSavedProgress(false)
    persistProgress({}, json.startedAt, json.questions, json.timeLimitMinutes)
  }

  const toggleAnswer = (questionId: string, choiceId: string, questionType: 'single' | 'multi') => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      const next = questionType === 'single'
        ? [choiceId]
        : current.includes(choiceId)
          ? current.filter((id) => id !== choiceId)
          : [...current, choiceId]
      const nextAnswers = { ...prev, [questionId]: next }
      if (startedAt) persistProgress(nextAnswers, startedAt, questions, timeLimitMinutes)
      return nextAnswers
    })
  }

  const submitExam = async () => {
    if (!startedAt) return
    setSubmitting(true)
    setExamError('')

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const payloadAnswers = questions.map((q) => ({
      questionId: q.id,
      selectedChoiceIds: answers[q.id] || [],
    }))

    const res = await fetch('/api/final-exams/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ examId, startedAt, answers: payloadAnswers }),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setExamError(json.error || 'Could not submit the exam.')
      return
    }

    clearProgress()
    setResult(json)
    setPhase('results')
  }

  const answeredCount = questions.filter((q) => (answers[q.id] || []).length > 0).length
  const allAnswered = questions.length > 0 && answeredCount === questions.length
  const timeLimitSeconds = timeLimitMinutes * 60
  const overTimeLimit = elapsedSeconds > timeLimitSeconds

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-brand-bg flex items-center justify-center text-brand-secondary text-sm">
        Loading exam…
      </div>
    )
  }

  if (phase === 'not-found' || !exam) {
    return (
      <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-brand-secondary text-sm">This exam couldn&apos;t be found.</p>
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
            href={`/courses/${exam.course?.slug || courseSlug}`}
            className="text-sm text-brand-secondary hover:text-brand-text transition"
          >
            ✕ Exit
          </Link>
          <span className="flex items-center gap-2 text-xs text-brand-secondary uppercase tracking-wide">
            <DomainIcon slug="final-exams" className="w-4 h-4 text-brand-primary/70" />
            Final Exam
          </span>
        </div>

        {phase === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary mb-3">Final Exam</p>
            <h1 className="text-3xl sm:text-4xl font-display font-medium mb-4">{exam.title}</h1>
            <p className="text-brand-secondary text-lg max-w-xl mx-auto mb-3">
              {exam.question_count} questions, weighted across all domains the same way the real exam is.
              Timed at {formatDuration(timeLimitSeconds)} to match the real exam format - going over won&apos;t
              cut you off, it&apos;ll just show in your results.
            </p>
            {exam.description && (
              <p className="text-brand-secondary text-sm max-w-xl mx-auto mb-8">{exam.description}</p>
            )}
            {examError && <p className="text-red-500 text-sm mb-4">{examError}</p>}
            <div className="flex flex-col items-center gap-3">
              {hasSavedProgress ? (
                <>
                  <button
                    onClick={resumeExam}
                    className="bg-brand-primary text-black px-6 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                  >
                    Resume in-progress attempt
                  </button>
                  <button
                    onClick={() => startExam(true)}
                    className="text-sm text-brand-secondary hover:text-brand-text transition"
                  >
                    Start over instead
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startExam(true)}
                  className="bg-brand-primary text-black px-6 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                >
                  Start exam
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'exam' && (
          <div className="flex-1 flex flex-col py-4">
            <div className="sticky top-0 z-10 bg-brand-bg pb-4 mb-4 border-b border-brand-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl font-medium">{exam.title}</h1>
                <span className={`text-sm font-medium tabular-nums ${overTimeLimit ? 'text-amber-500' : 'text-brand-text'}`}>
                  ⏱ {formatDuration(elapsedSeconds)} / {formatDuration(timeLimitSeconds)}
                  {overTimeLimit ? ' (over limit)' : ''}
                </span>
              </div>
              <p className="text-sm text-brand-secondary mt-1">
                {answeredCount}/{questions.length} answered · answer every question, then submit.
              </p>
            </div>

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
                {submitting ? 'Submitting…' : 'Submit exam'}
              </button>
            )}
          </div>
        )}

        {phase === 'results' && result && (
          <div className="flex-1 flex flex-col py-4">
            <div className="text-center mb-6">
              <p className="text-5xl mb-2">{result.passed ? '✅' : '↻'}</p>
              <h1 className="text-2xl font-medium mb-1">
                {result.passed ? 'Passing-equivalent score!' : 'Below the passing-equivalent line'}
              </h1>
              <p className="text-brand-secondary text-sm">
                {result.correctCount}/{result.questionCount} correct ({result.scorePercent}%, {result.passThreshold}% treated as passing)
              </p>
              <p className="text-brand-secondary text-sm mt-1">
                Time: {formatDuration(result.elapsedSeconds)} / {formatDuration(result.timeLimitSeconds)} limit —{' '}
                {result.withinTimeLimit ? 'within the time limit' : 'over the time limit'}
              </p>
            </div>

            <div className="rounded-xl bg-brand-surface p-4 mb-8 text-xs text-brand-secondary leading-relaxed">
              {result.scoringDisclaimer}
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
                href={`/courses/${exam.course?.slug || courseSlug}`}
                className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
              >
                Back to course
              </Link>
              <button
                onClick={() => { setPhase('intro'); setHasSavedProgress(false) }}
                className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2.5"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}