'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'dan@orivian.io'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
}

type CourseStats = {
  id: string
  title: string
  enrolledCount: number
  avgCompletion: number
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [totalEnrollments, setTotalEnrollments] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setAuthorized(true)

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      setProfiles(profilesData || [])

      const { data: courses } = await supabase.from('courses').select('*')
      const { data: enrollments } = await supabase.from('enrollments').select('course_id')
      const { data: progress } = await supabase.from('progress').select('lesson_id')

      setTotalEnrollments(enrollments?.length || 0)

      const completedLessonIds = new Set(progress?.map((p) => p.lesson_id))

      const stats: CourseStats[] = []

      for (const course of courses || []) {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', course.id)

        const enrolledCount = enrollments?.filter((e) => e.course_id === course.id).length || 0
        const totalLessons = lessons?.length || 0

        let avgCompletion = 0
        if (totalLessons > 0) {
          const completedForCourse = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0
          avgCompletion = Math.round((completedForCourse / totalLessons) * 100)
        }

        stats.push({
          id: course.id,
          title: course.title,
          enrolledCount,
          avgCompletion,
        })
      }

      setCourseStats(stats)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading || !authorized) return null

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-10">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="border border-brand-muted/30 rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-brand-primary">{profiles.length}</p>
          <p className="text-sm text-brand-secondary mt-1">Total Signups</p>
        </div>
        <div className="border border-brand-muted/30 rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-brand-primary">{totalEnrollments}</p>
          <p className="text-sm text-brand-secondary mt-1">Total Enrollments</p>
        </div>
        <div className="border border-brand-muted/30 rounded-lg p-6 text-center">
          <p className="text-3xl font-bold text-brand-primary">{courseStats.length}</p>
          <p className="text-sm text-brand-secondary mt-1">Live Courses</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Course Usage</h2>
      <div className="space-y-3 mb-12">
        {courseStats.map((c) => (
          <div key={c.id} className="border border-brand-muted/30 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">{c.title}</h3>
              <span className="text-sm text-brand-secondary">{c.enrolledCount} enrolled</span>
            </div>
            <div className="w-full h-1.5 bg-brand-muted/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-full"
                style={{ width: `${c.avgCompletion}%` }}
              />
            </div>
            <p className="text-xs text-brand-secondary mt-1">{c.avgCompletion}% avg. completion</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Signups</h2>
      <div className="space-y-2">
        {profiles.slice(0, 15).map((p) => (
          <div
            key={p.id}
            className="flex justify-between text-sm border-b border-brand-muted/10 py-2"
          >
            <span>{p.full_name || 'No name'} — {p.email}</span>
            <span className="text-brand-secondary">
              {new Date(p.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}