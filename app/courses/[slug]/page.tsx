'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ResetProgressDialog from '@/components/ResetProgressDialog'
import RemoveCourseDialog from '@/components/RemoveCourseDialog'
import ReportProblem from '@/components/ReportProblem'
import { DomainIcon } from '@/lib/domain-icons'
import { SummitIcon } from '@/components/Icons'
import TrailMap, { type TrailStep } from '@/components/TrailMap'
import { renderInline } from '@/lib/inline-format'
import type { User } from '@supabase/supabase-js'

type Course = {
  id: string
  slug: string
  title: string
  description: string
  difficulty: string | null
  provider: string | null
  avg_training_time: string | null
  why_it_matters: string | null
}

type Section = {
  id: string
  slug: string
  title: string
  description: string | null
  order_index: number
}

type Lesson = {
  id: string
  title: string
  content: string
  order_index: number
  section_id: string | null
  estimated_minutes: number | null
  summary: string | null
  exam_frequency: string | null
  lesson_type: string
}

type Resource = {
  id: string
  title: string
  url: string
}

type FinalExam = {
  id: string
  slug: string
  title: string
  description: string | null
  order_index: number
  time_limit_minutes: number
  question_count: number
}

// 45 seconds per mini-exam question (reverted from an earlier 2-minute
// high-balled estimate). Rounded to a whole minute in lessonMinutes below,
// since formatDuration expects whole-minute totals.
const MINUTES_PER_QUESTION = 0.75

function lessonMinutes(lesson: Lesson, questionCount: number): number {
  return Math.round((lesson.estimated_minutes || 0) + questionCount * MINUTES_PER_QUESTION)
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '—'
  if (totalMinutes < 60) return `~${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `~${hours}h` : `~${hours}h ${minutes}m`
}

const HIDE_COMPLETED_KEY = 'orivian.course.hideCompleted'

// One stop on the learner's path through a course: a lesson, a domain
// recap, or a domain checkpoint exam - in the order the page lists them.
type Step = {
  key: string
  kind: 'lesson' | 'recap' | 'checkpoint'
  sectionId: string | null
  title: string
  href: string
  done: boolean
  started: boolean
  // Exam taken but not passed yet (best score, if any).
  failedScore: number | null
  minutes: number
}

function toTrailStep(st: Step): TrailStep {
  return {
    key: st.key,
    title: st.kind === 'recap' ? `Recap: ${st.title}` : st.title,
    href: st.href,
    kind: st.kind,
    done: st.done,
    started: st.started,
    failed: st.failedScore !== null,
  }
}

export default function CoursePage() {
  const params = useParams()
  const slug = params.slug as string

  const [user, setUser] = useState<User | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [questionCounts, setQuestionCounts] = useState<Map<string, number>>(new Map())
  const [resources, setResources] = useState<Resource[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [startedIds, setStartedIds] = useState<Set<string>>(new Set())
  const [bestScoreByLesson, setBestScoreByLesson] = useState<Map<string, number>>(new Map())
  // Lessons whose mini-exam the learner has taken at least once, so the
  // lesson row can link to a review of past attempts.
  const [attemptedLessonIds, setAttemptedLessonIds] = useState<Set<string>>(new Set())
  const [checkpointCounts, setCheckpointCounts] = useState<Map<string, number>>(new Map())
  const [checkpointBestScore, setCheckpointBestScore] = useState<Map<string, number>>(new Map())
  const [checkpointPassed, setCheckpointPassed] = useState<Set<string>>(new Set())
  const [finalExams, setFinalExams] = useState<FinalExam[]>([])
  const [finalExamBest, setFinalExamBest] = useState<Map<string, { scorePercent: number; passed: boolean; withinTimeLimit: boolean }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(false)
  const [resetTarget, setResetTarget] = useState<{ scope: 'course' | 'lesson'; id: string; title: string } | null>(null)
  // Empty set = every domain starts collapsed; expanding one adds its
  // section id here.
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(new Set())
  // Until the learner opens or closes a domain themselves, the domain
  // holding their next step starts open.
  const [sectionsTouched, setSectionsTouched] = useState(false)

  // "Hide completed" toggle, remembered on this device.
  const [hideCompleted, setHideCompleted] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(HIDE_COMPLETED_KEY) === '1'
    } catch {
      return false
    }
  })
  const toggleHideCompleted = () => {
    setHideCompleted((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(HIDE_COMPLETED_KEY, next ? '1' : '0')
      } catch {
        // Storage blocked - the toggle just won't be remembered.
      }
      return next
    })
  }

  const toggleSection = (sectionId: string, autoOpenId: string | null) => {
    setOpenSectionIds((prev) => {
      const next = new Set(prev)
      if (!sectionsTouched && autoOpenId) next.add(autoOpenId)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
    setSectionsTouched(true)
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!courseData) {
        setLoading(false)
        return
      }
      setCourse(courseData)

      const { data: sectionsData } = await supabase
        .from('sections')
        .select('id, slug, title, description, order_index')
        .eq('course_id', courseData.id)
        .order('order_index')

      setSections(sectionsData || [])

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, title, content, order_index, section_id, estimated_minutes, summary, exam_frequency, lesson_type')
        .eq('course_id', courseData.id)
        .order('order_index')

      setLessons(lessonsData || [])

      // Question counts only - never question content/answers - via a
      // security-definer function, since the `questions` table itself has
      // no client-read policy at all.
      const { data: counts } = await supabase.rpc('lesson_question_counts', {
        p_course_id: courseData.id,
      })
      setQuestionCounts(new Map((counts || []).map((c: { lesson_id: string; question_count: number }) => [c.lesson_id, c.question_count])))

      // Same pattern, but for full-domain checkpoint question counts,
      // keyed by section instead of lesson.
      const { data: checkpointCountsData } = await supabase.rpc('section_checkpoint_question_count', {
        p_course_id: courseData.id,
      })
      setCheckpointCounts(new Map((checkpointCountsData || []).map((c: { section_id: string; question_count: number }) => [c.section_id, c.question_count])))

      // Final Exams: full-length, optional practice tests spanning every
      // domain. `final_exams` is publicly readable (like `sections`) - no
      // question content lives on it, so no RPC is needed just to show
      // the cards.
      const { data: finalExamsData } = await supabase
        .from('final_exams')
        .select('id, slug, title, description, order_index, time_limit_minutes, question_count')
        .eq('course_id', courseData.id)
        .order('order_index')

      setFinalExams(finalExamsData || [])

      const { data: resourcesData } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseData.id)
        .order('order_index')

      setResources(resourcesData || [])

      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseData.id)
          .maybeSingle()

        setEnrolled(!!enrollment)

        const { data: progress } = await supabase
          .from('progress')
          .select('lesson_id')
          .eq('user_id', user.id)

        setCompletedIds(new Set(progress?.map((p) => p.lesson_id)))

        const sectionIds = (sectionsData || []).map((s) => s.id)
        if (sectionIds.length > 0) {
          const { data: checkpointAttempts } = await supabase
            .from('exam_attempts')
            .select('section_id, score_percent, passed')
            .eq('user_id', user.id)
            .eq('attempt_type', 'section_exam')
            .in('section_id', sectionIds)

          const cpBest = new Map<string, number>()
          const cpPassed = new Set<string>()
          checkpointAttempts?.forEach((a) => {
            if (!a.section_id) return
            const prevBest = cpBest.get(a.section_id) ?? -1
            if (a.score_percent > prevBest) cpBest.set(a.section_id, a.score_percent)
            if (a.passed) cpPassed.add(a.section_id)
          })
          setCheckpointBestScore(cpBest)
          setCheckpointPassed(cpPassed)
        }

        const finalExamIds = (finalExamsData || []).map((e) => e.id)
        if (finalExamIds.length > 0) {
          const { data: finalExamAttempts } = await supabase
            .from('exam_attempts')
            .select('final_exam_id, score_percent, passed, within_time_limit')
            .eq('user_id', user.id)
            .eq('attempt_type', 'final_exam')
            .in('final_exam_id', finalExamIds)

          const feBest = new Map<string, { scorePercent: number; passed: boolean; withinTimeLimit: boolean }>()
          finalExamAttempts?.forEach((a) => {
            if (!a.final_exam_id) return
            const prev = feBest.get(a.final_exam_id)
            if (!prev || a.score_percent > prev.scorePercent) {
              feBest.set(a.final_exam_id, {
                scorePercent: a.score_percent,
                passed: a.passed,
                withinTimeLimit: a.within_time_limit,
              })
            }
          })
          setFinalExamBest(feBest)
        }

        const lessonIds = (lessonsData || []).map((l) => l.id)

        if (lessonIds.length > 0) {
          // A lesson counts as "started" if the learner has either logged
          // study time in it or attempted (and possibly failed) its
          // mini-exam - either is evidence they've been inside it, even if
          // they haven't passed yet.
          const [{ data: studySessions }, { data: attempts }] = await Promise.all([
            supabase
              .from('study_sessions')
              .select('lesson_id')
              .eq('user_id', user.id)
              .in('lesson_id', lessonIds),
            supabase
              .from('exam_attempts')
              .select('lesson_id, score_percent')
              .eq('user_id', user.id)
              .eq('attempt_type', 'mini_exam')
              .in('lesson_id', lessonIds),
          ])

          const started = new Set<string>()
          studySessions?.forEach((s) => s.lesson_id && started.add(s.lesson_id))

          const bestScores = new Map<string, number>()
          const attempted = new Set<string>()
          attempts?.forEach((a) => {
            if (!a.lesson_id) return
            started.add(a.lesson_id)
            attempted.add(a.lesson_id)
            const prevBest = bestScores.get(a.lesson_id) ?? -1
            if (a.score_percent > prevBest) bestScores.set(a.lesson_id, a.score_percent)
          })

          setStartedIds(started)
          setBestScoreByLesson(bestScores)
          setAttemptedLessonIds(attempted)
        }
      }

      setLoading(false)
    }

    load()
  }, [slug])

  const handleEnroll = async () => {
    if (!user || !course) return
    await supabase.from('enrollments').insert({
      user_id: user.id,
      course_id: course.id,
    })
    setEnrolled(true)
  }

  if (loading) return null
  if (!course) return <main className="max-w-3xl mx-auto py-12 px-4">Course not found.</main>

  const percent = lessons.length > 0
    ? Math.round((completedIds.size / lessons.length) * 100)
    : 0

  const courseTotalMinutes = lessons.reduce(
    (sum, l) => sum + lessonMinutes(l, questionCounts.get(l.id) || 0),
    0
  )

  const lessonsBySection = new Map<string, Lesson[]>()
  const recapBySection = new Map<string, Lesson>()
  const unsectioned: Lesson[] = []
  for (const lesson of lessons) {
    if (lesson.lesson_type === 'recap') {
      if (lesson.section_id) recapBySection.set(lesson.section_id, lesson)
      continue
    }
    if (!lesson.section_id) {
      unsectioned.push(lesson)
      continue
    }
    const list = lessonsBySection.get(lesson.section_id) || []
    list.push(lesson)
    lessonsBySection.set(lesson.section_id, list)
  }

  const lessonStep = (l: Lesson): Step => ({
    key: l.id,
    kind: l.lesson_type === 'recap' ? 'recap' : 'lesson',
    sectionId: l.section_id,
    title: l.title,
    href: `/learn/${slug}/${l.id}`,
    done: completedIds.has(l.id),
    started: startedIds.has(l.id),
    failedScore: !completedIds.has(l.id) && bestScoreByLesson.has(l.id) ? bestScoreByLesson.get(l.id)! : null,
    minutes: lessonMinutes(l, questionCounts.get(l.id) || 0),
  })
  const stepsBySection = new Map<string, Step[]>()
  for (const section of sections) {
    const sectionLessons = lessonsBySection.get(section.id) || []
    if (sectionLessons.length === 0) continue
    const steps = sectionLessons.map(lessonStep)
    const recap = recapBySection.get(section.id)
    if (recap) steps.push(lessonStep(recap))
    const cpCount = checkpointCounts.get(section.id) || 0
    if (cpCount > 0) {
      steps.push({
        key: `checkpoint-${section.id}`,
        kind: 'checkpoint',
        sectionId: section.id,
        title: `${section.title}: full-domain exam`,
        href: `/learn/${slug}/checkpoint/${section.id}`,
        done: checkpointPassed.has(section.id),
        started: checkpointBestScore.has(section.id),
        failedScore:
          !checkpointPassed.has(section.id) && checkpointBestScore.has(section.id) ? checkpointBestScore.get(section.id)! : null,
        minutes: Math.round(cpCount * MINUTES_PER_QUESTION),
      })
    }
    stepsBySection.set(section.id, steps)
  }
  const allSteps = [
    ...sections.flatMap((s) => stepsBySection.get(s.id) || []),
    ...unsectioned.map(lessonStep),
  ]
  // Overall progress counts every step, so it matches the segmented bar.
  const stepsPercent = allSteps.length > 0 ? Math.round((allSteps.filter((x) => x.done).length / allSteps.length) * 100) : percent
  const nextStep = enrolled ? allSteps.find((st) => !st.done) ?? null : null
  const nextSection = nextStep?.sectionId ? sections.find((s) => s.id === nextStep.sectionId) ?? null : null
  const autoOpenId = !sectionsTouched && nextStep?.sectionId ? nextStep.sectionId : null
  const hiddenDomains = hideCompleted
    ? sections.filter((s) => {
        const st = stepsBySection.get(s.id)
        return !!st && st.every((x) => x.done)
      })
    : []

  return (
    <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6">
      <h1 className="text-4xl font-medium mb-3">{course.title}</h1>
      <p className="text-brand-secondary text-lg mb-6">{renderInline(course.description)}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {course.difficulty && (
          <span className="text-xs border border-brand-muted/40 rounded-full px-3 py-1">
            {course.difficulty}
          </span>
        )}
        {course.provider && (
          <span className="text-xs border border-brand-muted/40 rounded-full px-3 py-1">
            {course.provider}
          </span>
        )}
        {courseTotalMinutes > 0 && (
          <span className="text-xs border border-brand-muted/40 rounded-full px-3 py-1">
            {formatDuration(courseTotalMinutes)} total
          </span>
        )}
      </div>

      {course.why_it_matters && (
        <div className="rounded-xl bg-brand-surface p-6 mb-10">
          <h2 className="text-sm text-brand-secondary mb-2">Why professionals take this</h2>
          <p className="text-brand-text leading-relaxed">{renderInline(course.why_it_matters)}</p>
        </div>
      )}

      {!user && (
        <p className="text-sm text-brand-secondary mb-6">
          Log in to enroll and track your progress.
        </p>
      )}

      {user && !enrolled && (
        <button
          onClick={handleEnroll}
          className="bg-brand-primary text-black px-6 py-2.5 rounded-md font-medium mb-10 hover:bg-brand-primary-light transition"
        >
          Enroll in this course
        </button>
      )}

      {user && enrolled && (
        <>
        <div className="mb-6">
          <TrailMap
            stages={[
              ...sections
                .filter((sec) => stepsBySection.has(sec.id))
                .map((sec) => ({ id: sec.id, title: sec.title, steps: (stepsBySection.get(sec.id) || []).map(toTrailStep) })),
              ...(unsectioned.length > 0
                ? [{ id: 'more', title: 'More lessons', steps: unsectioned.map((l) => toTrailStep(lessonStep(l))) }]
                : []),
            ]}
            nextKey={nextStep?.key ?? null}
          />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <p className="mr-auto text-sm text-brand-secondary tabular-nums">
            <span className="font-display text-2xl text-brand-text">{stepsPercent}%</span>
            <span className="ml-2">
              of the trail covered, {allSteps.filter((x) => x.done).length} of {allSteps.length} waypoints
            </span>
          </p>

          <button
            type="button"
            onClick={() => setResetTarget({ scope: 'course', id: course.id, title: course.title })}
            className="text-xs text-brand-muted hover:text-red-400 transition whitespace-nowrap"
            title="Clear your progress and start this course fresh"
          >
            ↺ Reset
          </button>
          <button
            type="button"
            onClick={() => setRemoving(true)}
            className="text-xs text-brand-muted hover:text-red-400 transition whitespace-nowrap"
            title="Take this course off your home page and profile"
          >
            Remove
          </button>
        </div>
        </>
      )}
      {user && enrolled && (
        nextStep ? (
          <Link
            href={nextStep.href}
            className="group mb-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-xl border border-brand-primary/40 bg-brand-primary/10 p-4 sm:p-5 hover:bg-brand-primary/15 transition"
          >
            {nextSection && (
              <div className="hidden sm:flex shrink-0 h-11 w-11 rounded-full bg-brand-primary/15 items-center justify-center text-brand-primary">
                <DomainIcon slug={nextSection.slug} className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-display italic text-sm text-brand-primary mb-0.5">
                Next waypoint{nextSection ? <span className="text-brand-secondary not-italic font-sans"> in {nextSection.title}</span> : null}
              </p>
              <p className="font-medium text-lg leading-snug">
                {nextStep.kind === 'recap' ? 'Domain recap: ' : ''}
                {nextStep.title}
              </p>
              {nextStep.failedScore !== null ? (
                <p className="text-xs mt-0.5">
                  <span className="text-brand-alert">Not passed yet · best {Math.round(nextStep.failedScore)}%</span>
                  <span className="text-brand-secondary"> · 80% to pass</span>
                </p>
              ) : (
                nextStep.minutes > 0 && <p className="text-xs text-brand-secondary mt-0.5">{formatDuration(nextStep.minutes)}</p>
              )}
            </div>
            <span className="self-start sm:self-center shrink-0 bg-brand-primary text-black px-5 py-2.5 rounded-md text-sm font-medium group-hover:bg-brand-primary-light transition">
              {nextStep.failedScore !== null
                ? 'Try again'
                : nextStep.started
                  ? 'Continue →'
                  : nextStep.kind === 'checkpoint'
                    ? 'Start exam'
                    : 'Start'}
            </span>
          </Link>
        ) : allSteps.length > 0 ? (
          <div className="mb-8 rounded-xl border border-brand-success/40 bg-brand-success/10 p-5 text-sm">
            <p className="font-medium text-brand-success">✓ You&apos;ve completed every lesson and checkpoint in this course.</p>
            {finalExams.length > 0 && (
              <p className="text-brand-secondary mt-1">Next step: take a full-length Final Exam below to test yourself under exam conditions.</p>
            )}
          </div>
        ) : null
      )}

      {user && enrolled && allSteps.length > 0 && (
        <div className="mb-6 flex items-center justify-end gap-3">
          {hiddenDomains.length > 0 && (
            <p className="mr-auto text-sm text-brand-secondary">
              <span className="text-brand-success">✓</span> {hiddenDomains.length} completed domain
              {hiddenDomains.length === 1 ? '' : 's'} hidden
            </p>
          )}
          <label htmlFor="hide-completed" className="text-sm text-brand-secondary cursor-pointer select-none">
            Hide completed
          </label>
          <button
            id="hide-completed"
            type="button"
            role="switch"
            aria-checked={hideCompleted}
            onClick={toggleHideCompleted}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${hideCompleted ? 'bg-brand-primary' : 'bg-brand-muted/30'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-brand-bg shadow transition-transform ${hideCompleted ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>
      )}

      <RemoveCourseDialog
        course={removing ? { id: course.id, title: course.title } : null}
        onClose={() => setRemoving(false)}
        onDone={() => {
          setRemoving(false)
          setEnrolled(false)
        }}
      />

      <div className="space-y-10 mb-12">
        {sections.map((section) => {
          const sectionLessons = lessonsBySection.get(section.id) || []
          if (sectionLessons.length === 0) return null
          if (hiddenDomains.includes(section)) return null
          const sectionSteps = stepsBySection.get(section.id) || []
          const stepsDone = sectionSteps.filter((x) => x.done).length
          const hiddenInSection = hideCompleted ? stepsDone : 0
          const sectionMinutes = sectionLessons.reduce(
            (sum, l) => sum + lessonMinutes(l, questionCounts.get(l.id) || 0),
            0
          )

          const isOpen = openSectionIds.has(section.id) || autoOpenId === section.id
          const sectionDone = stepsDone === sectionSteps.length
          const hasNext = nextStep?.sectionId === section.id

          return (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleSection(section.id, autoOpenId)}
                aria-expanded={isOpen}
                className="w-full flex items-start gap-4 mb-4 text-left group cursor-pointer rounded-xl -mx-3 px-3 py-2 hover:bg-brand-surface active:bg-brand-surface-raised transition-colors"
              >
                <div
                  className={`relative shrink-0 h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
                    enrolled && sectionDone
                      ? 'bg-brand-success/15 text-brand-success'
                      : 'bg-brand-primary/10 text-brand-primary'
                  }`}
                >
                  <DomainIcon slug={section.slug} className="w-6 h-6" />
                  {enrolled && sectionDone && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-brand-success border border-brand-success text-black text-[10px] font-bold leading-none flex items-center justify-center"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-xl font-medium group-hover:text-brand-primary transition-colors">{section.title}</h2>
                    {sectionMinutes > 0 && (
                      <span className="text-xs text-brand-secondary whitespace-nowrap">
                        {formatDuration(sectionMinutes)} · {sectionLessons.length} lesson{sectionLessons.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  {section.description && (
                    <p className="text-sm text-brand-secondary mt-1">{renderInline(section.description)}</p>
                  )}
                  {enrolled && (
                    <div className="mt-3 flex items-center gap-3 max-w-xl">
                      <div
                        className="flex-1 flex gap-[3px]"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={sectionSteps.length}
                        aria-valuenow={stepsDone}
                        aria-label={`${section.title} progress`}
                      >
                        {sectionSteps.map((st) => {
                          const isNext = nextStep?.key === st.key
                          return (
                            <span
                              key={st.key}
                              title={`${st.kind === 'recap' ? 'Recap: ' : st.kind === 'checkpoint' ? 'Checkpoint: ' : ''}${st.title}${
                                st.done
                                  ? ' - done'
                                  : st.failedScore !== null
                                    ? ` - not passed yet (best ${Math.round(st.failedScore)}%)${isNext ? ', up next' : ''}`
                                    : isNext
                                      ? ' - up next'
                                      : st.started
                                        ? ' - in progress'
                                        : ''
                              }`}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                st.done
                                  ? 'bg-brand-success'
                                  : st.failedScore !== null
                                    ? `bg-brand-alert ${isNext ? 'ring-1 ring-brand-primary/80' : ''}`
                                    : isNext
                                    ? 'bg-brand-primary/35 ring-1 ring-brand-primary/80'
                                    : st.started
                                      ? 'bg-brand-primary/35'
                                      : 'bg-brand-muted/20'
                              } ${st.kind === 'checkpoint' ? 'max-w-[2.5rem]' : ''}`}
                            />
                          )
                        })}
                      </div>
                      <span
                        className={`text-xs whitespace-nowrap tabular-nums ${
                          sectionDone ? 'text-brand-success font-medium' : hasNext ? 'text-brand-primary' : stepsDone > 0 ? 'text-brand-text' : 'text-brand-muted'
                        }`}
                      >
                        {sectionDone
                          ? '✓ Complete'
                          : hasNext
                            ? `Up next · ${stepsDone} of ${sectionSteps.length}`
                            : stepsDone > 0
                              ? `${stepsDone} of ${sectionSteps.length} done`
                              : 'Not started'}
                      </span>
                    </div>
                  )}
                </div>
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`shrink-0 w-5 h-5 mt-3 text-brand-secondary transition-transform group-hover:text-brand-primary ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen && (
              <div className="sm:ml-[3.75rem] border-t border-brand-muted/15 divide-y divide-brand-muted/15">
                {hiddenInSection > 0 && (
                  <p className="text-xs text-brand-muted pb-1">
                    {hiddenInSection} completed item{hiddenInSection === 1 ? '' : 's'} hidden
                  </p>
                )}
                {sectionLessons.map((lesson) => {
                  const isComplete = completedIds.has(lesson.id)
                  if (hideCompleted && isComplete) return null
                  const isNext = nextStep?.key === lesson.id
                  const isStarted = !isComplete && startedIds.has(lesson.id)
                  const bestScore = bestScoreByLesson.get(lesson.id)
                  const hasAttempts = attemptedLessonIds.has(lesson.id)
                  const questionCount = questionCounts.get(lesson.id) || 0
                  const minutes = lessonMinutes(lesson, questionCount)

                  let statusLabel = 'Start lesson'
                  let statusClass = 'text-sm text-brand-secondary'
                  const isFailed = !isComplete && typeof bestScore === 'number'
                  if (isNext) {
                    statusLabel = isFailed ? 'Try again' : isStarted ? 'Continue' : 'Start'
                    statusClass = 'text-sm text-brand-primary font-medium'
                  } else if (isFailed) {
                    statusLabel = 'Try again'
                    statusClass = 'text-sm text-brand-alert'
                  }
                  if (isComplete) {
                    statusLabel = '✓ Completed'
                    statusClass = 'text-sm text-brand-success'
                  } else if (isStarted && !isNext && !isFailed) {
                    statusLabel = 'Continue lesson'
                    statusClass = 'text-sm text-brand-primary/80'
                  }

                  const inner = (
                    <>
                      <div className="min-w-0">
                        {isNext && (
                          <span className="font-display italic text-sm inline-block mb-1 text-brand-primary">
                            Up next
                          </span>
                        )}
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h3 className="font-medium">{lesson.title}</h3>
                          {(minutes > 0 || questionCount > 0) && (
                            <span className="text-xs text-brand-secondary whitespace-nowrap">
                              {[
                                minutes > 0 ? formatDuration(minutes) : null,
                                questionCount > 0 ? `${questionCount} question${questionCount === 1 ? '' : 's'}` : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          )}
                        </div>
                        {lesson.summary && (
                          <p className="text-sm text-brand-text/80 mt-1 max-w-xl">{renderInline(lesson.summary)}</p>
                        )}
                        {isStarted && typeof bestScore === 'number' && (
                          <p className="text-xs text-brand-secondary mt-1">
                            <span className="text-brand-alert">Best attempt: {bestScore}%</span> (80% needed to pass)
                          </p>
                        )}
                      </div>
                      <span className={`${statusClass} shrink-0 whitespace-nowrap self-start`}>{statusLabel}</span>
                    </>
                  )

                  return enrolled ? (
                    <div key={lesson.id} className="group relative">
                      <Link
                        href={`/learn/${slug}/${lesson.id}`}
                        className={`-mx-3 px-3 py-4 rounded-md transition hover:bg-brand-surface/70 flex items-start justify-between gap-4 ${hasAttempts ? 'pb-11' : ''} ${isNext ? 'bg-brand-primary/[0.06] shadow-[inset_2px_0_0_var(--color-brand-primary)]' : ''}`}
                      >
                        {inner}
                      </Link>
                      {(isComplete || isStarted || hasAttempts) && (
                        <div className="absolute bottom-3 right-0 flex items-center gap-4">
                          {(isComplete || isStarted) && (
                            <button
                              type="button"
                              onClick={() => setResetTarget({ scope: 'lesson', id: lesson.id, title: lesson.title })}
                              className="text-xs text-brand-muted hover:text-red-400 transition sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                              title="Reset this lesson's progress"
                            >
                              ↺ Reset
                            </button>
                          )}
                          {hasAttempts && (
                            <Link
                              href={`/courses/${slug}/review/${lesson.id}`}
                              className="text-xs text-brand-primary/90 hover:text-brand-primary hover:underline transition"
                              title="See your past mini-exam attempts and the questions you missed"
                            >
                              Review answers
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={lesson.id}
                      className="py-4 flex items-start justify-between gap-4"
                    >
                      {inner}
                    </div>
                  )
                })}

                {recapBySection.has(section.id) && (() => {
                  const recap = recapBySection.get(section.id)!
                  const isReviewed = completedIds.has(recap.id)
                  if (hideCompleted && isReviewed) return null
                  const isNext = nextStep?.key === recap.id
                  return enrolled ? (
                    <Link
                      href={`/learn/${slug}/${recap.id}`}
                      className={`-mx-3 px-3 py-4 rounded-md transition hover:bg-brand-surface/70 flex items-start justify-between gap-4 ${
                        isNext ? 'bg-brand-primary/[0.06] shadow-[inset_2px_0_0_var(--color-brand-primary)]' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          {isNext && (
                            <span className="font-display italic text-sm text-brand-primary">
                              Up next
                            </span>
                          )}
                          <span className="font-display italic text-sm text-brand-primary/80">Domain recap</span>
                        </div>
                        <h3 className="font-medium mt-0.5">{recap.title}</h3>
                        {recap.summary && (
                          <p className="text-sm text-brand-text/80 mt-1 max-w-xl">{renderInline(recap.summary)}</p>
                        )}
                      </div>
                      <span className={`${isReviewed ? 'text-brand-success' : 'text-brand-secondary'} text-sm shrink-0 whitespace-nowrap self-start`}>
                        {isReviewed ? '✓ Reviewed' : 'Review'}
                      </span>
                    </Link>
                  ) : (
                    <div className="py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="font-display italic text-sm text-brand-primary/80">Domain recap</span>
                        <h3 className="font-medium mt-0.5">{recap.title}</h3>
                      </div>
                    </div>
                  )
                })()}

                {(checkpointCounts.get(section.id) || 0) > 0 && (() => {
                  const passed = checkpointPassed.has(section.id)
                  if (hideCompleted && passed) return null
                  const best = checkpointBestScore.get(section.id)
                  const qCount = checkpointCounts.get(section.id) || 0
                  const isNext = nextStep?.key === `checkpoint-${section.id}`
                  return enrolled ? (
                    <Link
                      href={`/learn/${slug}/checkpoint/${section.id}`}
                      className={`-mx-3 px-3 py-4 rounded-md transition hover:bg-brand-surface/70 flex items-start justify-between gap-4 ${
                        isNext ? 'bg-brand-primary/[0.06] shadow-[inset_2px_0_0_var(--color-brand-primary)]' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          {isNext && (
                            <span className="font-display italic text-sm text-brand-primary">
                              Up next
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 font-display italic text-sm text-brand-primary/80">
                            <SummitIcon className="h-3.5 w-3.5" />
                            Domain checkpoint
                          </span>
                        </div>
                        <h3 className="font-medium mt-0.5">{section.title}: full-domain exam</h3>
                        <p className="text-sm text-brand-text/80 mt-1">{qCount} questions · 80% to pass</p>
                        {typeof best === 'number' && (
                          <p className="text-xs text-brand-secondary mt-1">Best score: {best}%</p>
                        )}
                      </div>
                      <span className={`${passed ? 'text-brand-success' : typeof best === 'number' ? 'text-brand-alert' : 'text-brand-secondary'} text-sm shrink-0 whitespace-nowrap self-start`}>
                        {passed ? '✓ Summit reached' : typeof best === 'number' ? 'Try again' : 'Start'}
                      </span>
                    </Link>
                  ) : (
                    <div className="py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="font-display italic text-sm text-brand-primary/80">Domain checkpoint</span>
                        <h3 className="font-medium mt-0.5">{section.title}: full-domain exam</h3>
                      </div>
                    </div>
                  )
                })()}
              </div>
              )}
            </div>
          )
        })}

        {unsectioned.length > 0 && (
          <div>
            <h2 className="text-xl font-medium mb-4">More Lessons</h2>
            <div className="border-t border-brand-muted/15 divide-y divide-brand-muted/15">
              {unsectioned.map((lesson) => {
                const isComplete = completedIds.has(lesson.id)
                if (hideCompleted && isComplete) return null
                return enrolled ? (
                  <Link
                    key={lesson.id}
                    href={`/learn/${slug}/${lesson.id}`}
                    className="-mx-3 px-3 py-4 rounded-md transition hover:bg-brand-surface/70 flex items-center justify-between"
                  >
                    <h3 className="font-medium">{lesson.title}</h3>
                    <span className={isComplete ? 'text-sm text-brand-success' : 'text-sm text-brand-secondary'}>
                      {isComplete ? '✓ Completed' : 'Start lesson'}
                    </span>
                  </Link>
                ) : (
                  <div
                    key={lesson.id}
                    className="py-4 flex items-center justify-between"
                  >
                    <h3 className="font-medium">{lesson.title}</h3>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {finalExams.length > 0 && (
        <div className="mb-12">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 h-11 w-11 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <DomainIcon slug="final-exams" className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-medium">Final Exams</h2>
              <p className="text-sm text-brand-secondary mt-1">
                Optional, but recommended once you&apos;ve worked through the domains. Full-length practice exams
                weighted like the real thing and timed to match it - going over doesn&apos;t cut you off,
                it just shows in your results.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {finalExams.map((exam) => {
              const best = finalExamBest.get(exam.id)
              return enrolled ? (
                <Link
                  key={exam.id}
                  href={`/learn/${slug}/final-exam/${exam.id}`}
                  className="rounded-xl bg-brand-surface-raised hover:bg-brand-surface transition p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <h3 className="font-medium">{exam.title}</h3>
                    <p className="text-sm text-brand-text/80 mt-1">
                      {exam.question_count} questions · {formatDuration(exam.time_limit_minutes)} time limit
                    </p>
                    {best && (
                      <p className="text-xs text-brand-secondary mt-1">
                        Best score: {best.scorePercent}% {best.passed ? '(passing-equivalent)' : ''}
                        {' · '}
                        {best.withinTimeLimit ? 'within time limit' : 'over time limit'}
                      </p>
                    )}
                  </div>
                  <span className={`${best?.passed ? 'text-brand-success' : 'text-brand-secondary'} text-sm shrink-0 whitespace-nowrap self-start`}>
                    {best ? 'Retake' : 'Start'}
                  </span>
                </Link>
              ) : (
                <div key={exam.id} className="rounded-xl bg-brand-surface-raised p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium">{exam.title}</h3>
                    <p className="text-sm text-brand-text/80 mt-1">
                      {exam.question_count} questions · {formatDuration(exam.time_limit_minutes)} time limit
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {resources.length > 0 && (
        <div>
          <h2 className="text-xl font-medium mb-4">Resources & References</h2>
          <div className="space-y-1">
            {resources.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl bg-brand-surface hover:bg-brand-surface-raised transition p-4 text-sm"
              >
                {r.title} <span className="text-brand-secondary">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
      {user && (
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-brand-muted/15 pt-6 text-sm text-brand-secondary">
          <span>Spotted a mistake or something unclear in this course?</span>
          <ReportProblem label="Report a problem" target={{ context: 'course', courseId: course.id }} />
        </div>
      )}
      {resetTarget && (
        <ResetProgressDialog
          open
          onClose={() => setResetTarget(null)}
          scope={resetTarget.scope}
          targetId={resetTarget.id}
          targetTitle={resetTarget.title}
          onDone={() => window.location.reload()}
        />
      )}
    </main>
  )
}
