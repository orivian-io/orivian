'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DomainIcon } from '@/lib/domain-icons'
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
}

type Resource = {
  id: string
  title: string
  url: string
}

// High-balled on purpose: 2 minutes per mini-exam question, so the
// estimate leans generous rather than under-promising someone's study time.
const MINUTES_PER_QUESTION = 2

function lessonMinutes(lesson: Lesson, questionCount: number): number {
  return (lesson.estimated_minutes || 0) + questionCount * MINUTES_PER_QUESTION
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '—'
  if (totalMinutes < 60) return `~${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `~${hours}h` : `~${hours}h ${minutes}m`
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
  const [loading, setLoading] = useState(true)
  // Empty set = every domain starts collapsed; expanding one adds its
  // section id here.
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    setOpenSectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
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
        .select('id, title, content, order_index, section_id, estimated_minutes, summary, exam_frequency')
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
          attempts?.forEach((a) => {
            if (!a.lesson_id) return
            started.add(a.lesson_id)
            const prevBest = bestScores.get(a.lesson_id) ?? -1
            if (a.score_percent > prevBest) bestScores.set(a.lesson_id, a.score_percent)
          })

          setStartedIds(started)
          setBestScoreByLesson(bestScores)
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
  const unsectioned: Lesson[] = []
  for (const lesson of lessons) {
    if (!lesson.section_id) {
      unsectioned.push(lesson)
      continue
    }
    const list = lessonsBySection.get(lesson.section_id) || []
    list.push(lesson)
    lessonsBySection.set(lesson.section_id, list)
  }

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
        <div className="flex items-center gap-3 mb-10">
          <div className="flex-1 h-1.5 bg-brand-muted/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm text-brand-secondary whitespace-nowrap">{percent}% complete</span>
        </div>
      )}

      <div className="space-y-10 mb-12">
        {sections.map((section) => {
          const sectionLessons = lessonsBySection.get(section.id) || []
          if (sectionLessons.length === 0) return null
          const sectionMinutes = sectionLessons.reduce(
            (sum, l) => sum + lessonMinutes(l, questionCounts.get(l.id) || 0),
            0
          )

          const isOpen = openSectionIds.has(section.id)
          const completedInSection = sectionLessons.filter((l) => completedIds.has(l.id)).length

          return (
            <div key={section.id}>
                            <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                className="w-full flex items-start gap-4 mb-4 text-left group cursor-pointer rounded-xl -mx-3 px-3 py-2 hover:bg-brand-surface active:bg-brand-surface-raised transition-colors"
              >
                <div className="shrink-0 h-11 w-11 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <DomainIcon slug={section.slug} className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-xl font-medium group-hover:text-brand-primary transition-colors">{section.title}</h2>
                    {sectionMinutes > 0 && (
                      <span className="text-xs text-brand-secondary whitespace-nowrap">
                        {formatDuration(sectionMinutes)} · {sectionLessons.length} lesson{sectionLessons.length === 1 ? '' : 's'}
                        {completedInSection > 0 ? ` · ${completedInSection} done` : ''}
                      </span>
                    )}
                  </div>
                  {section.description && (
                    <p className="text-sm text-brand-secondary mt-1">{renderInline(section.description)}</p>
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
              <div className="space-y-1">
                {sectionLessons.map((lesson) => {
                  const isComplete = completedIds.has(lesson.id)
                  const isStarted = !isComplete && startedIds.has(lesson.id)
                  const bestScore = bestScoreByLesson.get(lesson.id)
                  const minutes = lessonMinutes(lesson, questionCounts.get(lesson.id) || 0)

                  let statusLabel = 'Start lesson →'
                  let statusClass = 'text-sm text-brand-secondary'
                  if (isComplete) {
                    statusLabel = '✓ Completed'
                    statusClass = 'text-sm text-brand-primary'
                  } else if (isStarted) {
                    statusLabel = 'Continue lesson →'
                    statusClass = 'text-sm text-brand-primary/80'
                  }

                  const inner = (
                    <>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <h3 className="font-medium">{lesson.title}</h3>
                          {minutes > 0 && (
                            <span className="text-xs text-brand-secondary whitespace-nowrap">{formatDuration(minutes)}</span>
                          )}
                        </div>
                        {lesson.summary && (
                          <p className="text-sm text-brand-text/80 mt-1 max-w-xl">{renderInline(lesson.summary)}</p>
                        )}
                        {isStarted && typeof bestScore === 'number' && (
                          <p className="text-xs text-brand-secondary mt-1">
                            Last attempt: {bestScore}% (80% needed to pass)
                          </p>
                        )}
                      </div>
                      <span className={`${statusClass} shrink-0 whitespace-nowrap self-start`}>{statusLabel}</span>
                    </>
                  )

                  return enrolled ? (
                    <Link
                      key={lesson.id}
                      href={`/learn/${slug}/${lesson.id}`}
                      className="rounded-xl bg-brand-surface hover:bg-brand-surface-raised transition p-4 flex items-start justify-between gap-4"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={lesson.id}
                      className="rounded-xl bg-brand-surface p-4 flex items-start justify-between gap-4"
                    >
                      {inner}
                    </div>
                  )
                })}
              </div>
              )}
            </div>
          )
        })}

        {unsectioned.length > 0 && (
          <div>
            <h2 className="text-xl font-medium mb-4">More Lessons</h2>
            <div className="space-y-1">
              {unsectioned.map((lesson) => {
                const isComplete = completedIds.has(lesson.id)
                return enrolled ? (
                  <Link
                    key={lesson.id}
                    href={`/learn/${slug}/${lesson.id}`}
                    className="rounded-xl bg-brand-surface hover:bg-brand-surface-raised transition p-4 flex items-center justify-between"
                  >
                    <h3 className="font-medium">{lesson.title}</h3>
                    <span className={isComplete ? 'text-sm text-brand-primary' : 'text-sm text-brand-secondary'}>
                      {isComplete ? '✓ Completed' : 'Start lesson →'}
                    </span>
                  </Link>
                ) : (
                  <div
                    key={lesson.id}
                    className="rounded-xl bg-brand-surface p-4 flex items-center justify-between"
                  >
                    <h3 className="font-medium">{lesson.title}</h3>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

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
    </main>
  )
}