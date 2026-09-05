'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Course = {
  id: string
  slug: string
  title: string
  description: string
}

type Lesson = {
  id: string
  title: string
  content: string
  order_index: number
}

export default function CoursePage() {
  const params = useParams()
  const slug = params.slug as string

  const [user, setUser] = useState<User | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
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

  const toggleComplete = async (lessonId: string) => {
    if (!user) return

    if (completedIds.has(lessonId)) {
      await supabase
        .from('progress')
        .delete()
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)

      const next = new Set(completedIds)
      next.delete(lessonId)
      setCompletedIds(next)
    } else {
      await supabase.from('progress').insert({
        user_id: user.id,
        lesson_id: lessonId,
      })

      const next = new Set(completedIds)
      next.add(lessonId)
      setCompletedIds(next)
    }
  }

  if (loading) return null
  if (!course) return <main className="max-w-3xl mx-auto py-12 px-4">Course not found.</main>

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="text-brand-secondary mt-2 mb-6">{course.description}</p>

      {!user && (
        <p className="text-sm text-brand-secondary mb-6">
          Log in to enroll and track your progress.
        </p>
      )}

      {user && !enrolled && (
        <button
          onClick={handleEnroll}
          className="bg-brand-primary text-black px-6 py-2 rounded-md font-medium mb-8"
        >
          Enroll in this course
        </button>
      )}

      {user && enrolled && (
        <p className="text-sm text-brand-primary mb-6">You're enrolled in this course.</p>
      )}

      <h2 className="text-xl font-semibold mb-4">Lessons</h2>
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="border border-brand-muted/30 rounded-lg p-4 flex items-center justify-between"
          >
            <h3 className="font-medium">{lesson.title}</h3>
            {enrolled && (
              <button
                onClick={() => toggleComplete(lesson.id)}
                className={
                  completedIds.has(lesson.id)
                    ? 'text-sm text-brand-primary'
                    : 'text-sm text-brand-secondary underline'
                }
              >
                {completedIds.has(lesson.id) ? '✓ Completed' : 'Mark complete'}
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}