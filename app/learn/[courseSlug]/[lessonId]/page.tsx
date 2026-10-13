'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CloseIcon, CompassMoment, ElevationIcon, NotesIcon, PauseIcon, RetryIcon, SoundIcon, StopIcon, TimerIcon } from '@/components/Icons'
import ReportProblem from '@/components/ReportProblem'
import { supabase } from '@/lib/supabase'
import { useStudyTimer } from '@/lib/use-study-timer'
import { blockToSpeechText, type ContentBlock } from '@/lib/narration'
import { getNarrationPrefs, prefetchNarration, startNarration, stopNarration } from '@/lib/narrator'
import { createReadAlong } from '@/lib/read-along'
import { notifyProgress } from '@/lib/stats'
import { createNote, listLessonNotes, type Note } from '@/lib/notes'
import LessonNotes from '@/components/LessonNotes'
import SaveSelectionButton from '@/components/SaveSelectionButton'
import { DomainIcon } from '@/lib/domain-icons'
import VoiceSettings from '@/components/VoiceSettings'
import AnswerChoices from '@/components/AnswerChoices'
import { renderInline } from '@/lib/inline-format'
import { formatDuration } from '@/lib/format-duration'

type Lesson = {
  id: string
  title: string
  content_blocks: ContentBlock[]
  lesson_type: string
  section: { title: string; slug: string } | null
  course: { id: string; slug: string; title: string } | null
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
  results: { questionId: string; correct: boolean; explanation: string | null; correctChoiceIds?: string[] }[]
}

type NextLesson = { id: string; title: string }

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

  // Learner's private notes for this lesson (null while loading).
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)

  // Number of mini-exam questions, shown on the Start button.
  const [questionCount, setQuestionCount] = useState<number | null>(null)
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null)

  // The lesson that follows this one in the course (null if this is the
  // last one), for the "Next lesson" buttons.
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null)

  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [examError, setExamError] = useState('')
  const [loadingExam, setLoadingExam] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)

  // Only accrues study time while actually reading content or taking the
  // exam - not while looking at results. todaySeconds/totalSeconds are
  // the learner's live, server-synced study time for this course - today
  // and all-time - shown as running timers in the header.
  const { todaySeconds, totalSeconds, paused: timerPaused } = useStudyTimer(phase === 'content' || phase === 'exam' ? lessonId : null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, content_blocks, lesson_type, sections(title, slug), courses(id, slug, title)')
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

      listLessonNotes(data.id)
        .then(setNotes)
        .catch(() => setNotes([]))

      if (course?.id) void loadNextLesson(course.id, data.id).then(setNextLesson)

      // Same security-definer count the course page uses (question content
      // itself is never readable from the browser).
      if (course?.id) {
        supabase
          .rpc('lesson_question_counts', { p_course_id: course.id })
          .then(({ data: counts }) => {
            const match = (counts || []).find((c: { lesson_id: string; question_count: number }) => c.lesson_id === data.id)
            if (match) setQuestionCount(match.question_count)
          })
      }
    }

    load()
  }, [lessonId, router])

  // Load this lesson's narration manifest up front so Listen starts
  // instantly (mobile browsers only allow audio to start straight from a tap).
  useEffect(() => {
    if (lesson?.id) void prefetchNarration(lesson.id)
  }, [lesson?.id])

  // Stop narration on unmount, and whenever the phase or lesson changes.
  // Moving between slides is handled in goToBlock (so auto-play can start
  // the next slide's narration without being cancelled here).
  // Stopping fires the narration's onEnd, which resets `speaking`.
  useEffect(() => () => stopNarration(), [])
  useEffect(() => {
    stopNarration()
  }, [phase, lessonId])

  const blockRef = useRef<HTMLDivElement>(null)

  // "Save to notes" on selected lesson text: saves the quote, then opens the
  // notes panel with that note ready for the learner's own thoughts.
  const saveSelectionToNotes = async (text: string) => {
    if (!lesson) return
    setNotesOpen(true)
    try {
      const note = await createNote({ quote: text, lesson_id: lesson.id, course_id: lesson.course?.id ?? null })
      setNotes((prev) => [note, ...(prev ?? [])])
      setFocusNoteId(note.id)
    } catch {
      // The panel stays open so the learner can retry by typing the note.
    }
  }

  const currentBlock = lesson?.content_blocks[blockIndex]
  const isLastBlock = lesson ? blockIndex === lesson.content_blocks.length - 1 : false

  // Reads a block aloud with read-along highlighting. The highlighter is
  // attached on the first progress update rather than up front, so this can
  // be called from the Next click before the new slide has rendered - which
  // keeps playback inside the tap, as mobile browsers require.
  const narrateBlock = (block: ContentBlock) => {
    if (!lesson) return
    stopNarration()
    const text = blockToSpeechText(block)
    let readAlong: ReturnType<typeof createReadAlong> | null = null
    setSpeaking(true)
    startNarration({
      lessonId: lesson.id,
      text,
      onProgress: (progress) => {
        readAlong ??= createReadAlong(blockRef.current, text)
        readAlong.update(progress)
      },
      onEnd: () => {
        readAlong?.clear()
        setSpeaking(false)
      },
    })
  }

  const handleListen = () => {
    if (!currentBlock) return
    if (speaking) {
      stopNarration()
      return
    }
    narrateBlock(currentBlock)
  }

  // Next/Back. Always stops the current slide's narration; if the learner
  // has turned on auto-play, starts reading the new slide straight away.
  const goToBlock = (index: number) => {
    if (!lesson) return
    stopNarration()
    setBlockIndex(index)
    const block = lesson.content_blocks[index]
    if (block && getNarrationPrefs().autoPlay) narrateBlock(block)
  }

  // Keyboard: arrow keys move between slides, L listens, N opens notes.
  // The handler is refreshed every render so it always sees current state.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    keyHandler.current = (e: KeyboardEvent) => {
      if (phase !== 'content' || !lesson || e.altKey || e.ctrlKey || e.metaKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const last = lesson.content_blocks.length - 1
      if (e.key === 'ArrowRight' && blockIndex < last) {
        e.preventDefault()
        goToBlock(blockIndex + 1)
      } else if (e.key === 'ArrowLeft' && blockIndex > 0) {
        e.preventDefault()
        goToBlock(blockIndex - 1)
      } else if (e.key === 'l' || e.key === 'L') {
        handleListen()
      } else if (e.key === 'n' || e.key === 'N') {
        setNotesOpen((o) => !o)
      }
    }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandler.current(e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Shared by domain recaps and Domain 0 orientation lessons - both are
  // no-exam lesson types where reaching the end of the content is enough
  // to mark them complete (see app/api/lessons/recap-complete/route.ts).
  const [completingNonExam, setCompletingNonExam] = useState(false)

  const completeNonExamLesson = async () => {
    setCompletingNonExam(true)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    await fetch('/api/lessons/recap-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lessonId }),
    })
    notifyProgress()

    router.push(
      nextLesson
        ? `/learn/${lesson?.course?.slug || courseSlug}/${nextLesson.id}`
        : `/courses/${lesson?.course?.slug || courseSlug}`
    )
  }

  const startExam = async () => {
    setPhase('exam')
    setExamError('')
    setSubmitting(false)
    setQuestions([])
    setLoadingExam(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setExamError('Your session has expired. Please sign in again to take the exam.')
        return
      }

      // Give up after 20s rather than leaving the learner on a blank page.
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      const res = await fetch('/api/exams/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lessonId }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))

      // The server can answer with a non-JSON error page (e.g. a crash or
      // timeout), so don't assume the body parses.
      const json = await res.json().catch(() => null)

      if (!res.ok || !json || !Array.isArray(json.questions)) {
        console.error('[exam] start failed', res.status, json)
        setExamError(json?.error || `Could not load the exam (error ${res.status}).`)
        return
      }

      setQuestions(json.questions)
      setAnswers({})
      setResult(null)
    } catch (err) {
      console.error('[exam] start failed', err)
      setExamError(
        err instanceof DOMException && err.name === 'AbortError'
          ? 'The exam took too long to load. Check your connection and try again.'
          : 'Could not load the exam. Check your connection and try again.'
      )
    } finally {
      setLoadingExam(false)
    }
  }

  // "Retake exam" from the attempt review page links here with ?retake=1 -
  // skip the slides and go straight into a fresh attempt.
  const retakeRequested = useRef(false)
  useEffect(() => {
    retakeRequested.current = new URLSearchParams(window.location.search).get('retake') === '1'
  }, [])
  useEffect(() => {
    if (phase !== 'content' || !lesson || !retakeRequested.current) return
    if (lesson.lesson_type === 'recap' || lesson.lesson_type === 'orientation') return
    const timer = setTimeout(() => {
      retakeRequested.current = false
      window.history.replaceState(null, '', window.location.pathname)
      void startExam()
    }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lesson])

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
    notifyProgress()
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
            <CloseIcon className="inline h-3.5 w-3.5 -mt-0.5 mr-1" />Exit
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setNotesOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full border border-brand-muted/30 px-2.5 py-1 text-xs text-brand-secondary transition hover:border-brand-primary/60 hover:text-brand-primary"
              aria-expanded={notesOpen}
            >
              <NotesIcon className="h-3.5 w-3.5" />
              Notes{notes && notes.length > 0 ? ` (${notes.length})` : ''}
            </button>
            {todaySeconds !== null && timerPaused && (
              <span
                className="text-xs text-brand-muted"
                title="Your study timer pauses when you switch away or haven't interacted for 2 minutes. Scroll, click, or press a key to resume."
              >
                <PauseIcon className="inline h-3.5 w-3.5 -mt-0.5" /> Timer paused
              </span>
            )}
            {todaySeconds !== null && (
              <span
                className="flex items-center gap-1.5 text-xs text-brand-secondary tabular-nums"
                title={`Time studying ${lesson.course?.title || 'this course'} today`}
              >
                <TimerIcon className="h-3.5 w-3.5" />
                Today {formatDuration(todaySeconds)}
              </span>
            )}
            {totalSeconds !== null && (
              <span
                className="flex items-center gap-1.5 text-xs text-brand-secondary tabular-nums"
                title={`Total time studying ${lesson.course?.title || 'this course'}`}
              >
                <ElevationIcon className="h-3.5 w-3.5" />
                Total {formatDuration(totalSeconds)}
              </span>
            )}
            {lesson.section?.title && (
              <span className="font-display italic text-sm flex items-center gap-2 text-brand-secondary">
                <DomainIcon slug={lesson.section.slug} className="w-4 h-4 text-brand-primary/70" />
                {lesson.section.title}
              </span>
            )}
          </div>
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

            <div ref={blockRef} className="flex-1 flex flex-col justify-start pt-4 sm:pt-10 pb-8 w-full max-w-[42rem] mx-auto">
              <ContentBlockView block={currentBlock} isOrientation={lesson.lesson_type === 'orientation'} />
            </div>

            <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-brand-muted/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleListen}
                  className="text-sm text-brand-secondary hover:text-brand-primary transition flex items-center gap-1.5"
                >
                  {speaking ? <StopIcon className="h-4 w-4" /> : <SoundIcon className="h-4 w-4" />}
                  {speaking ? 'Stop' : 'Listen'}
                </button>
                <VoiceSettings />
                <span className="mx-1 h-4 w-px bg-brand-muted/30" aria-hidden="true" />
                <ReportProblem
                  label="Report"
                  target={{
                    context: 'lesson',
                    courseId: lesson.course?.id,
                    lessonId: lesson.id,
                    blockIndex,
                    snapshot: blockToSpeechText(currentBlock),
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                {blockIndex > 0 && (
                  <button
                    onClick={() => goToBlock(blockIndex - 1)}
                    className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2"
                  >
                    Back
                  </button>
                )}
                {isLastBlock ? (
                  lesson.lesson_type === 'recap' ? (
                    <button
                      onClick={completeNonExamLesson}
                      disabled={completingNonExam}
                      className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition disabled:opacity-40"
                    >
                      {completingNonExam ? 'Saving…' : nextLesson ? 'Mark as reviewed & continue →' : 'Mark as reviewed'}
                    </button>
                  ) : lesson.lesson_type === 'orientation' ? (
                    <button
                      onClick={completeNonExamLesson}
                      disabled={completingNonExam}
                      className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition disabled:opacity-40"
                    >
                      {completingNonExam ? 'Saving…' : nextLesson ? 'Mark as complete & continue →' : 'Mark as complete'}
                    </button>
                  ) : (
                    <button
                      onClick={startExam}
                      className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                    >
                      {questionCount ? `Start ${questionCount}-question mini-exam` : 'Start mini-exam'}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => goToBlock(blockIndex + 1)}
                    className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 hidden text-right text-xs text-brand-muted sm:block" aria-hidden="true">
              <Kbd>←</Kbd> <Kbd>→</Kbd> move between slides · <Kbd>L</Kbd> listen · <Kbd>N</Kbd> notes
            </p>
          </>
        )}

        {phase === 'exam' && (
          <div className="flex-1 flex flex-col py-4">
            <h1 className="text-xl font-medium mb-1">{lesson.title}: mini-exam</h1>
            <p className="text-sm text-brand-secondary mb-6">
              Answer every question, then submit. You need {questions.length > 0 ? '80%' : '…'} to pass.
            </p>

            {loadingExam && <p className="text-sm text-brand-secondary mb-4">Loading questions…</p>}

            {examError && (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <p className="text-red-500 text-sm">{examError}</p>
                <button
                  onClick={startExam}
                  className="text-sm text-brand-primary hover:underline"
                >
                  Try again
                </button>
                <button
                  onClick={() => setPhase('content')}
                  className="text-sm text-brand-secondary hover:text-brand-text"
                >
                  Back to lesson
                </button>
              </div>
            )}

            <div className="space-y-6 mb-8">
              {questions.map((q, qi) => (
                <div key={q.id} className="rounded-xl bg-brand-surface p-5">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <p className="font-medium">{qi + 1}. {q.question_text}</p>
                    <span className="shrink-0 pt-0.5">
                      <ReportProblem variant="link" label="Report" target={{ context: 'mini_exam', lessonId: lesson.id, courseId: lesson.course?.id, questionId: q.id }} />
                    </span>
                  </div>
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
              <div className="mb-3 flex justify-center">
                {result.passed ? (
                  <CompassMoment className="h-16 w-16 text-brand-success" />
                ) : (
                  <RetryIcon className="h-12 w-12 text-brand-alert" />
                )}
              </div>
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
                    <p className={`text-sm font-medium ${r?.correctChoiceIds ? 'mb-3' : 'mb-1'} ${r?.correct ? 'text-brand-success' : 'text-red-500'}`}>
                      {r?.correct ? '✓' : '✗'} {qi + 1}. {q.question_text}
                    </p>
                    {r?.correctChoiceIds && (
                      <AnswerChoices
                        choices={q.choices}
                        selectedChoiceIds={answers[q.id] || []}
                        correctChoiceIds={r.correctChoiceIds}
                      />
                    )}
                    {r?.explanation && (
                      <p className="text-sm text-brand-secondary">{r.explanation}</p>
                    )}
                    <div className="mt-2 text-right">
                      <ReportProblem
                        variant="link"
                        label="Report a problem with this question"
                        target={{ context: 'results', lessonId: lesson.id, courseId: lesson.course?.id, questionId: q.id, snapshot: r?.explanation ? `Explanation: ${r.explanation}` : null }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {result.passed ? (
                <>
                  {nextLesson ? (
                    <Link
                      href={`/learn/${lesson.course?.slug || courseSlug}/${nextLesson.id}`}
                      className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                      title={nextLesson.title}
                    >
                      Next lesson →
                    </Link>
                  ) : (
                    <Link
                      href={`/courses/${lesson.course?.slug || courseSlug}`}
                      className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                    >
                      Back to course
                    </Link>
                  )}
                  <button
                    onClick={startExam}
                    className="border border-brand-primary/50 text-brand-primary px-4 py-2.5 rounded-md text-sm hover:bg-brand-primary/10 transition"
                  >
                    ↻ Retake exam
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startExam}
                    className="bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium hover:bg-brand-primary-light transition"
                  >
                    ↻ Try again
                  </button>
                  <button
                    onClick={() => { stopNarration(); setPhase('content'); setBlockIndex(0) }}
                    className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2.5"
                  >
                    Review lesson
                  </button>
                  {nextLesson && (
                    <Link
                      href={`/learn/${lesson.course?.slug || courseSlug}/${nextLesson.id}`}
                      className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2.5"
                      title={nextLesson.title}
                    >
                      Skip to next lesson
                    </Link>
                  )}
                </>
              )}
              <Link
                href={`/courses/${lesson.course?.slug || courseSlug}/review/${lesson.id}`}
                className="text-sm text-brand-secondary hover:text-brand-primary transition px-3 py-2.5"
              >
                All attempts
              </Link>
              {result.passed && nextLesson && (
                <Link
                  href={`/courses/${lesson.course?.slug || courseSlug}`}
                  className="text-sm text-brand-secondary hover:text-brand-text transition px-3 py-2.5"
                >
                  Back to course
                </Link>
              )}
            </div>
            {result.passed && nextLesson && (
              <p className="mt-3 text-xs text-brand-secondary">Up next: {nextLesson.title}</p>
            )}
          </div>
        )}
      </div>

      {phase === 'content' && <SaveSelectionButton containerRef={blockRef} onSave={saveSelectionToNotes} />}
      <LessonNotes
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        lessonId={lesson.id}
        courseId={lesson.course?.id ?? null}
        lessonTitle={lesson.title}
        notes={notes}
        setNotes={(update) => setNotes((prev) => update(prev ?? []))}
        focusNoteId={focusNoteId}
      />
    </div>
  )
}

function ContentBlockView({ block, nested = false, isOrientation = false }: { block: ContentBlock; nested?: boolean; isOrientation?: boolean }) {
  switch (block.type) {
    case 'heading':
      return (
        <h1 className={nested ? 'text-xl font-display font-medium mb-2' : 'text-3xl sm:text-4xl font-display font-medium mb-2'}>
          {renderInline(block.text)}
        </h1>
      )
    case 'paragraph':
      return (
        <p className={nested ? 'text-base sm:text-lg leading-[1.7] text-brand-text' : 'text-lg sm:text-xl leading-[1.7] text-brand-text'}>
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
          <p className="text-brand-text text-base sm:text-lg leading-[1.7]">{renderInline(block.definition)}</p>
        </div>
      )
    case 'title':
      return (
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl font-display font-medium">{renderInline(block.text)}</h1>
          {block.overview && (
            <p className="text-lg sm:text-xl leading-[1.7] text-brand-text">{renderInline(block.overview)}</p>
          )}
          {block.examContext && (
            <div className="rounded-xl border border-brand-primary/30 bg-brand-surface p-5 sm:p-6">
              <p className="font-display italic text-sm text-brand-primary mb-2">
                {isOrientation ? 'Why this matters' : 'How this shows up on the exam'}
              </p>
              <p className="text-brand-text text-base sm:text-lg leading-[1.7]">
                {renderInline(block.examContext)}
              </p>
            </div>
          )}
        </div>
      )
    case 'group':
      return (
        <div className="space-y-5">
          {block.heading && (
            <h2 className="font-display italic text-base text-brand-secondary">
              {block.heading}
            </h2>
          )}
          {block.blocks?.map((child, i) => (
            <ContentBlockView key={i} block={child} nested isOrientation={isOrientation} />
          ))}
          {block.items && block.items.length > 0 && (
            <dl className="space-y-3">
              {block.items.map((item, i) => (
                <div key={i} className="rounded-xl bg-brand-surface p-4 sm:p-5">
                  <dt className="text-brand-primary font-medium">{renderInline(item.label)}</dt>
                  <dd className="mt-1 text-brand-text text-base sm:text-lg leading-[1.7]">{renderInline(item.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )
    default:
      return null
  }
}

// Finds the lesson after `lessonId` in course order: domains by their order,
// each domain's lessons by order with its recap last, then any lessons that
// aren't in a domain - the same order the course page lists them in.
async function loadNextLesson(courseId: string, lessonId: string): Promise<NextLesson | null> {
  const [{ data: sections }, { data: lessons }] = await Promise.all([
    supabase.from('sections').select('id, order_index').eq('course_id', courseId),
    supabase
      .from('lessons')
      .select('id, title, section_id, order_index, lesson_type')
      .eq('course_id', courseId)
      .order('order_index'),
  ])
  if (!lessons) return null

  const sectionOrder = new Map((sections || []).map((s) => [s.id, s.order_index as number]))
  const rank = (l: { section_id: string | null; lesson_type: string | null; order_index: number }) => [
    l.section_id && sectionOrder.has(l.section_id) ? (sectionOrder.get(l.section_id) as number) : Number.MAX_SAFE_INTEGER,
    l.lesson_type === 'recap' ? 1 : 0,
    l.order_index,
  ]
  const ordered = [...lessons].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]
    return 0
  })
  const i = ordered.findIndex((l) => l.id === lessonId)
  const next = i >= 0 ? ordered[i + 1] : undefined
  return next ? { id: next.id, title: next.title } : null
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.4rem] justify-center rounded border border-brand-muted/40 px-1 font-sans text-[11px] text-brand-secondary">
      {children}
    </kbd>
  )
}
