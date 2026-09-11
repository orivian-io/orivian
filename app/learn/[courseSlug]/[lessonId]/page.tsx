'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useStudyTimer } from '@/lib/use-study-timer'
import { blockToSpeechText, speak, stopSpeaking, isSpeechSupported, type ContentBlock } from '@/lib/tts'
import { DomainIcon } from '@/lib/domain-icons'
import { renderInline } from '@/lib/inline-format'

type Lesson = {
  id: string
  title: string
  content_blocks: ContentBlock[]
  lesson_type: string
  section: { title: string; slug: string } | null
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

type Phase = 'loading' | 'content' | 'exam' | 'results' | 'not-found'

export default function LessonPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const courseSlug = params.courseSlug as string
  const lessonId = params.lessonId as string

  const [phase, setPhase] = useState<Phase>('loading')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [blockIndex, setBlockIndex] = useState(0)
  const [speaking, setSpeaking] = useState(false)

  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [examError, setExamError] = useState('')
  const [result, setResult] = useState<ExamResult | null>(null)

  // Only accrues study time while actually reading content or taking the
  // exam - not while looking at results.
  useStudyTimer(phase === 'content' || phase === 'exam' ? lessonId : null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, content_blocks, lesson_type, sections(title, slug), courses(slug, title)')
        .eq('id', lessonId)
        .single()

      if (error || !data) {
        setPhase('not-found')
        return
      }

      const section = Array.isArray(data.sections) ? data.sections[0] : data.sections
      const course = Array.isArray(data.courses) ? data.courses[0] : data.courses

      setLesson({
        id: data.id,
        title: data.title,
        content_blocks: (data.content_blocks as ContentBlock[]) || [],
        lesson_type: data.lesson_type || 'standard',
        section: section || null,
        course: course || null,
      })
      setPhase('content')
    }

    load()
  }, [lessonId, router])

  // Stop any narration on unmount, and whenever the visible block/phase changes.
  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => {
    stopSpeaking()
    setSpeaking(false)
  }, [blockIndex, phase])

  const currentBlock = lesson?.content_blocks[blockIndex]
  const isLastBlock = lesson ? blockIndex === lesson.content_blocks.length - 1 : false

  const handleListen = () => {
    if (!currentBlock) return
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    speak(blockToSpeechText(currentBlock), () => setSpeaking(false))
  }

  const [completingRecap, setCompletingRecap] = useState(false)

  const completeRecap = async () => {
    setCompletingRecap(true)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    await fetch('/api/lessons/recap-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lessonId }),
    })

    router.push(`/courses/${lesson?.course?.slug || courseSlug}`)
  }

  const startExam = async () => {
    setPhase('exam')
    setExamError('')
    setSubmitting(false)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const res = await fetch('/api/exams/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lessonId }),
    })
    const json = await res.json()

    if (!res.ok) {
      setExamError(json.error || 'Could not load the exam.')
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
      body: JSON.stringify({ lessonId, answers: payloadAnswers }),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setExamError(json.error || 'Could not submit the exam.')
      return
    }

    setResult(json)
    setPhase('results')
  }

  const allAnswered = questions.length > 0 && questions.every((q) => (answers[q.id] || []).length > 0)

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-brand-bg flex items-center justify-center text-brand-secondary text-sm">
        Loading lesson…
      </div>
    )
  }

  if (phase === 'not-found' || !lesson) {
    return (
      <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-brand-secondary text-sm">This lesson couldn&apos;t be found.</p>
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
            href={`/courses/${lesson.course?.slug || courseSlug}`}
            className="text-sm text-brand-secondary hover:text-brand-text transition"
          >
            ✕ Exit
          </Link>
          {lesson.section?.title && (
            <span className="flex items-center gap-2 text-xs text-brand-secondary uppercase tracking-wide">
              <DomainIcon slug={lesson.section.slug} className="w-4 h-4 text-brand-primary/70" />
              {lesson.section.title}
            </span>
          )}
        </div>

        {phase === 'content' && lesson.content_blocks.length > 0 && currentBlock && (
          <>
            <div className="flex gap-1.5 mb-8">
              {lesson.content_blocks.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i <= blockIndex ? 'bg-brand-primary' : 'bg-brand-muted/20'}`}
                />
              ))}
            </div>

            <div className="flex-1 flex flex-col justify-start pt-4 sm:pt-10 pb-8">
              <ContentBlockView block={currentBlock} />
            </div>

            <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-brand-muted/10">
              {isSpeechSupported() ? (
                <button
                  onClick={handleListen}
                  className="text-sm text-brand-secondary hover:text-brand-primary transition flex items-center gap-1.5"
                >
                  {speaking ? '⏸ Pause' : '🔊 Listen'}
                </button>
              ) : <span />}

              <div className="flex items-center gap-3">
                {blockIndex > 0 && (
                  <button
                    onClick={() => setBlockIndex((i) => i - 1)}
                    className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2"
                  >
                    Back
                  </button>
                )}
                {isLastBlock ? (
                  lesson.lesson_type === 'recap' ? (
                    <button
                      onClick={completeRecap}
                      disabled={completingRecap}
                      className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition disabled:opacity-40"
                    >
                      {completingRecap ? 'Saving…' : 'Mark as reviewed'}
                    </button>
                  ) : (
                    <button
                      onClick={startExam}
                      className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                    >
                      Start mini-exam
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => setBlockIndex((i) => i + 1)}
                    className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {phase === 'exam' && (
          <div className="flex-1 flex flex-col py-4">
            <h1 className="text-xl font-medium mb-1">{lesson.title}: mini-exam</h1>
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
                {submitting ? 'Submitting…' : 'Submit exam'}
              </button>
            )}
          </div>
        )}

        {phase === 'results' && result && (
          <div className="flex-1 flex flex-col py-4">
            <div className="text-center mb-8">
              <p className="text-5xl mb-2">{result.passed ? '✅' : '↻'}</p>
              <h1 className="text-2xl font-medium mb-1">
                {result.passed ? 'Lesson complete!' : 'Not quite — try again'}
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
              {result.passed ? (
                <Link
                  href={`/courses/${lesson.course?.slug || courseSlug}`}
                  className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                >
                  Back to course
                </Link>
              ) : (
                <>
                  <button
                    onClick={startExam}
                    className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => { setPhase('content'); setBlockIndex(0) }}
                    className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2.5"
                  >
                    Review lesson
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ContentBlockView({ block, nested = false }: { block: ContentBlock; nested?: boolean }) {
  switch (block.type) {
    case 'heading':
      return (
        <h1 className={nested ? 'text-xl font-display font-medium mb-2' : 'text-3xl sm:text-4xl font-display font-medium mb-2'}>
          {renderInline(block.text)}
        </h1>
      )
    case 'paragraph':
      return (
        <p className={nested ? 'text-base sm:text-lg leading-relaxed text-brand-text' : 'text-lg sm:text-xl leading-relaxed text-brand-text'}>
          {renderInline(block.text)}
        </p>
      )
    case 'list':
      return block.style === 'numbered' ? (
        <ol className="list-decimal list-inside space-y-2 text-base sm:text-lg text-brand-text">
          {block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ol>
      ) : (
        <ul className="list-disc list-inside space-y-2 text-base sm:text-lg text-brand-text">
          {block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ul>
      )
    case 'callout':
      return (
        <div className="rounded-xl bg-brand-primary/10 border border-brand-primary/30 p-4 sm:p-5 text-sm sm:text-base text-brand-text">
          {renderInline(block.text)}
        </div>
      )
    case 'key_term':
      return (
        <div className="rounded-xl bg-brand-surface p-5 sm:p-6">
          <p className="text-brand-primary font-medium mb-1 text-lg">{block.term}</p>
          <p className="text-brand-text text-base sm:text-lg leading-relaxed">{renderInline(block.definition)}</p>
        </div>
      )
    case 'title':
      return (
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl font-display font-medium">{renderInline(block.text)}</h1>
          <p className="text-lg sm:text-xl leading-relaxed text-brand-text">{renderInline(block.overview)}</p>
          <div className="rounded-xl border border-brand-primary/30 bg-brand-surface p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary mb-2">
              How this shows up on the exam
            </p>
            <p className="text-brand-text text-base sm:text-lg leading-relaxed">
              {renderInline(block.examContext)}
            </p>
          </div>
        </div>
      )
    case 'group':
      return (
        <div className="space-y-5">
          {block.heading && (
            <h2 className="text-sm font-medium uppercase tracking-wide text-brand-secondary">
              {block.heading}
            </h2>
          )}
          {block.blocks.map((child, i) => (
            <ContentBlockView key={i} block={child} nested />
          ))}
        </div>
      )
    default:
      return null
  }
}