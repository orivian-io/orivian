'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LiveActivity from '@/components/LiveActivity'

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

type StudyTimeRow = {
  user_id: string
  email: string | null
  full_name: string | null
  course_id: string | null
  course_title: string | null
  current_seconds: number
  archived_seconds: number
  last_studied_at: string | null
}

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

type CourseRequest = {
  id: string
  requested_title: string
  notes: string | null
  created_at: string
  user_id: string | null
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [totalEnrollments, setTotalEnrollments] = useState(0)
  const [requests, setRequests] = useState<CourseRequest[]>([])
  const [studyTime, setStudyTime] = useState<StudyTimeRow[] | null>(null)
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

      const { data: requestsData } = await supabase
        .from('course_requests')
        .select('*')
        .order('created_at', { ascending: false })

      setRequests(requestsData || [])

      // Lifetime study time comes from a server route (service role), since
      // it includes time learners have reset from their own timers.
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const res = await fetch('/api/admin/study-time', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch(() => null)
        const json = res?.ok ? await res.json().catch(() => null) : null
        setStudyTime(json?.rows ?? [])
      }

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

      <div className="mb-12">
        <LiveActivity variant="admin" />
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

      <h2 className="text-xl font-semibold mb-4">
        Course Requests {requests.length > 0 && `(${requests.length})`}
      </h2>
      {requests.length === 0 && (
        <p className="text-brand-secondary text-sm mb-12">No requests yet.</p>
      )}
      <div className="space-y-3 mb-12">
        {requests.map((r) => (
          <div key={r.id} className="border border-brand-muted/30 rounded-lg p-4">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-medium">{r.requested_title}</h3>
              <span className="text-xs text-brand-secondary whitespace-nowrap ml-4">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {r.notes && <p className="text-sm text-brand-secondary mb-1">{r.notes}</p>}
            <p className="text-xs text-brand-secondary">
              {r.user_id ? 'Submitted by registered user' : 'Submitted anonymously'}
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-1">Study Time by Learner</h2>
      <p className="text-xs text-brand-secondary mb-4">
        Lifetime engaged time per course. &quot;Reset&quot; is time a learner cleared from their own timer - it still counts here.
      </p>
      {studyTime === null ? (
        <p className="text-brand-secondary text-sm mb-12">Loading…</p>
      ) : studyTime.length === 0 ? (
        <p className="text-brand-secondary text-sm mb-12">No study time recorded yet.</p>
      ) : (
        <div className="mb-12 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-brand-secondary border-b border-brand-muted/20">
                <th className="py-2 pr-4 font-normal">Learner</th>
                <th className="py-2 pr-4 font-normal">Course</th>
                <th className="py-2 pr-4 font-normal text-right">Lifetime</th>
                <th className="py-2 pr-4 font-normal text-right">Reset</th>
                <th className="py-2 font-normal text-right">Last studied</th>
              </tr>
            </thead>
            <tbody>
              {studyTime.map((r) => (
                <tr key={`${r.user_id}-${r.course_id}`} className="border-b border-brand-muted/10">
                  <td className="py-2 pr-4">{r.full_name || r.email || 'Unknown'}</td>
                  <td className="py-2 pr-4 text-brand-secondary">{r.course_title || '-'}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{formatHours(r.current_seconds + r.archived_seconds)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-brand-secondary">
                    {r.archived_seconds > 0 ? formatHours(r.archived_seconds) : '-'}
                  </td>
                  <td className="py-2 text-right text-brand-secondary whitespace-nowrap">
                    {r.last_studied_at ? new Date(r.last_studied_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
