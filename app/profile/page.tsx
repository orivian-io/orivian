'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type CourseProgress = {
  course_id: string
  slug: string
  title: string
  totalLessons: number
  completedLessons: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, courses(id, slug, title)')
        .eq('user_id', user.id)

      if (!enrollments || enrollments.length === 0) {
        setLoading(false)
        return
      }

      const { data: allProgress } = await supabase
        .from('progress')
        .select('lesson_id')
        .eq('user_id', user.id)

      const completedLessonIds = new Set(allProgress?.map((p) => p.lesson_id))

      const results: CourseProgress[] = []

      for (const enrollment of enrollments) {
        const course = Array.isArray(enrollment.courses)
          ? enrollment.courses[0]
          : enrollment.courses
        if (!course) continue

        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', course.id)

        const totalLessons = lessons?.length || 0
        const completedLessons = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0

        results.push({
          course_id: course.id,
          slug: course.slug,
          title: course.title,
          totalLessons,
          completedLessons,
        })
      }

      setCourses(results)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) return null

  const inProgress = courses.filter((c) => c.completedLessons < c.totalLessons)
  const completed = courses.filter((c) => c.totalLessons > 0 && c.completedLessons === c.totalLessons)

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">
        {user?.user_metadata?.full_name || user?.email}
      </h1>
      <p className="text-brand-secondary mb-10">
        {completed.length} completed · {inProgress.length} in progress
      </p>

      <h2 className="text-xl font-semibold mb-4">In Progress</h2>
      {inProgress.length === 0 && (
        <p className="text-brand-secondary text-sm mb-8">Nothing in progress yet.</p>
      )}
      <div className="space-y-3 mb-10">
        {inProgress.map((c) => (
          <Link
            key={c.course_id}
            href={`/courses/${c.slug}`}
            className="block border border-brand-muted/30 rounded-lg p-4 hover:border-brand-primary transition"
          >
            <h3 className="font-medium">{c.title}</h3>
            <p className="text-sm text-brand-secondary mt-1">
              {c.completedLessons} / {c.totalLessons} lessons complete
            </p>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Completed</h2>
      {completed.length === 0 && (
        <p className="text-brand-secondary text-sm">No completed courses yet.</p>
      )}
      <div className="space-y-3">
        {completed.map((c) => (
          <Link
            key={c.course_id}
            href={`/courses/${c.slug}`}
            className="block border border-brand-primary/40 rounded-lg p-4 hover:border-brand-primary transition"
          >
            <h3 className="font-medium">{c.title}</h3>
            <p className="text-sm text-brand-primary mt-1">✓ Completed</p>
          </Link>
        ))}
      </div>
    </main>
  )
}