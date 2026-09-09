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
  description: string
  totalLessons: number
  completedLessons: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<CourseProgress[]>([])
  const [otherCourses, setOtherCourses] = useState<{ slug: string; title: string; description: string }[]>([])
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

      const { data: allCourses } = await supabase
        .from('courses')
        .select('*')
        .eq('published', true)

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)

      const enrolledIds = new Set(enrollments?.map((e) => e.course_id))

      const { data: allProgress } = await supabase
        .from('progress')
        .select('lesson_id')
        .eq('user_id', user.id)

      const completedLessonIds = new Set(allProgress?.map((p) => p.lesson_id))

      const enrolled: CourseProgress[] = []
      const notEnrolled: { slug: string; title: string; description: string }[] = []

      for (const course of allCourses || []) {
        if (enrolledIds.has(course.id)) {
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('course_id', course.id)

          const totalLessons = lessons?.length || 0
          const completedLessons = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0

          enrolled.push({
            course_id: course.id,
            slug: course.slug,
            title: course.title,
            description: course.description,
            totalLessons,
            completedLessons,
          })
        } else {
          notEnrolled.push({
            slug: course.slug,
            title: course.title,
            description: course.description,
          })
        }
      }

      setEnrolledCourses(enrolled)
      setOtherCourses(notEnrolled)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto py-24 px-6 text-center text-sm text-brand-secondary">
        Loading your dashboard…
      </main>
    )
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]

  const inProgress = enrolledCourses.filter((c) => c.completedLessons < c.totalLessons)
  const completed = enrolledCourses.filter((c) => c.totalLessons > 0 && c.completedLessons === c.totalLessons)
  const lessonsCompleted = enrolledCourses.reduce((sum, c) => sum + c.completedLessons, 0)

  const stats = [
    { label: 'In progress', value: inProgress.length },
    { label: 'Completed', value: completed.length },
    { label: 'Lessons completed', value: lessonsCompleted },
  ]

  return (
    <main className="max-w-5xl mx-auto py-14 px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-medium mb-2">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-brand-secondary">
          {enrolledCourses.length === 0
            ? "You haven't started a course yet — pick one below."
            : `${inProgress.length} course${inProgress.length === 1 ? '' : 's'} in progress.`}
        </p>
      </div>

      {enrolledCourses.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-12">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-brand-surface border border-white/5 p-5">
              <p className="text-2xl sm:text-3xl font-medium text-brand-primary font-display">{s.value}</p>
              <p className="text-xs sm:text-sm text-brand-secondary mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="mb-14">
          <h2 className="text-sm font-medium text-brand-secondary uppercase tracking-wide mb-4">
            Continue where you left off
          </h2>
          <div className="space-y-3">
            {inProgress.map((c) => {
              const percent = c.totalLessons > 0
                ? Math.round((c.completedLessons / c.totalLessons) * 100)
                : 0
              return (
                <Link
                  key={c.course_id}
                  href={`/courses/${c.slug}`}
                  className="group flex items-center gap-5 rounded-xl bg-brand-surface border border-white/5 hover:border-brand-primary/30 hover:bg-brand-surface-raised transition p-5"
                >
                  <div className="relative h-14 w-14 shrink-0 rounded-full flex items-center justify-center"
                    style={{
                      background: `conic-gradient(var(--color-brand-primary) ${percent * 3.6}deg, var(--color-brand-surface-raised) 0deg)`,
                    }}
                  >
                    <div className="h-11 w-11 rounded-full bg-brand-surface flex items-center justify-center text-xs font-medium text-brand-primary">
                      {percent}%
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium group-hover:text-brand-primary transition truncate">
                      {c.title}
                    </h3>
                    <p className="text-sm text-brand-secondary">
                      {c.completedLessons} of {c.totalLessons} lessons complete
                    </p>
                  </div>
                  <span className="hidden sm:flex shrink-0 items-center gap-1 text-sm text-brand-secondary group-hover:text-brand-primary transition">
                    Resume
                    <span aria-hidden="true" className="transition group-hover:translate-x-0.5">→</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {otherCourses.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-brand-secondary uppercase tracking-wide mb-4">
            {enrolledCourses.length === 0 ? 'Available courses' : 'Explore more'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherCourses.map((c) => (
              <Link
                key={c.slug}
                href={`/courses/${c.slug}`}
                className="rounded-xl bg-brand-surface border border-white/5 hover:border-brand-primary/30 hover:bg-brand-surface-raised transition p-5"
              >
                <h3 className="font-medium mb-1">{c.title}</h3>
                <p className="text-sm text-brand-secondary line-clamp-2">{c.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}