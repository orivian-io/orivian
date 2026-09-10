'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
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

type Lesson = {
  id: string
  title: string
  content: string
  order_index: number
}

type Resource = {
  id: string
  title: string
  url: string
}

export default function CoursePage() {
  const params = useParams()
  const slug = params.slug as string

  const [user, setUser] = useState<User | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

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

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseData.id)
        .order('order_index')

      setLessons(lessonsData || [])

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

  return (
    <main className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-medium mb-3">{course.title}</h1>
      <p className="text-brand-secondary text-lg mb-6">{course.description}</p>

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
        {course.avg_training_time && (
          <span className="text-xs border border-brand-muted/40 rounded-full px-3 py-1">
            {course.avg_training_time}
          </span>
        )}
      </div>

      {course.why_it_matters && (
        <div className="rounded-xl bg-brand-surface p-6 mb-10">
          <h2 className="text-sm text-brand-secondary mb-2">Why professionals take this</h2>
          <p className="text-brand-text leading-relaxed">{course.why_it_matters}</p>
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

      <h2 className="text-xl font-medium mb-4">Lessons</h2>
      <div className="space-y-1 mb-12">
        {lessons.map((lesson) => {
          const isComplete = completedIds.has(lesson.id)
          const content = enrolled ? (
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
          return content
        })}
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