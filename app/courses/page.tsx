'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type CourseCard = {
  id: string
  slug: string
  title: string
  description: string
  totalLessons: number
  completedLessons: number
  enrolled: boolean
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('published', true)

      if (!coursesData) {
        setLoading(false)
        return
      }

      let enrolledCourseIds = new Set<string>()
      let completedLessonIds = new Set<string>()

      if (user) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id)

        enrolledCourseIds = new Set(enrollments?.map((e) => e.course_id))

        const { data: progress } = await supabase
          .from('progress')
          .select('lesson_id')
          .eq('user_id', user.id)

        completedLessonIds = new Set(progress?.map((p) => p.lesson_id))
      }

      const results: CourseCard[] = []

      for (const course of coursesData) {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', course.id)

        const totalLessons = lessons?.length || 0
        const completedLessons = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0

        results.push({
          ...course,
          totalLessons,
          completedLessons,
          enrolled: enrolledCourseIds.has(course.id),
        })
      }

      setCourses(results)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return null

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Courses</h1>
      <div className="space-y-4">
        {courses.map((course) => {
          const percent = course.totalLessons > 0
            ? Math.round((course.completedLessons / course.totalLessons) * 100)
            : 0
          const isComplete = course.enrolled && percent === 100

          return (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="block border border-brand-muted/30 rounded-lg p-6 hover:border-brand-primary transition"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-semibold">{course.title}</h2>
                {course.enrolled && (
                  <span className={isComplete ? 'text-xs text-brand-primary' : 'text-xs text-brand-secondary'}>
                    {isComplete ? '✓ Completed' : `${percent}% complete`}
                  </span>
                )}
              </div>
              <p className="text-brand-secondary mb-3">{course.description}</p>

              {course.enrolled ? (
                <div className="w-full h-1.5 bg-brand-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              ) : (
                <span className="text-xs text-brand-secondary">Not enrolled</span>
              )}
            </Link>
          )
        })}
      </div>
    </main>
  )
}