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

type CourseStudyTime = {
  totalSeconds: number
  todaySeconds: number
}

type ProfileFields = {
  job_title: string
  company: string
  bio: string
  linkedin_url: string
}

function formatStudyTime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0 && minutes === 0) return '0m'
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<CourseProgress[]>([])
  const [studySeconds, setStudySeconds] = useState(0)
  const [studySecondsToday, setStudySecondsToday] = useState(0)
  const [courseStudyTimes, setCourseStudyTimes] = useState<Record<string, CourseStudyTime>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<ProfileFields>({
    job_title: '',
    company: '',
    bio: '',
    linkedin_url: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('job_title, company, bio, linkedin_url')
        .eq('id', user.id)
        .single()

      if (profileRow) {
        setFields({
          job_title: profileRow.job_title || '',
          company: profileRow.company || '',
          bio: profileRow.bio || '',
          linkedin_url: profileRow.linkedin_url || '',
        })
      }

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, courses(id, slug, title)')
        .eq('user_id', user.id)

      if (enrollments && enrollments.length > 0) {
        const { data: allProgress } = await supabase
          .from('progress')
          .select('lesson_id')
          .eq('user_id', user.id)

        const completedLessonIds = new Set(allProgress?.map((p) => p.lesson_id))

        const results: CourseProgress[] = []
        const studyTimes: Record<string, CourseStudyTime> = {}

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

          const { data: breakdown } = await supabase.rpc('course_study_breakdown', {
            p_user_id: user.id,
            p_course_id: course.id,
          })
          const breakdownRow = Array.isArray(breakdown) ? breakdown[0] : breakdown
          studyTimes[course.id] = {
            totalSeconds: breakdownRow?.total_seconds || 0,
            todaySeconds: breakdownRow?.today_seconds || 0,
          }
        }

        setCourses(results)
        setCourseStudyTimes(studyTimes)
      }

      const { data: totalStudySeconds } = await supabase.rpc('total_study_seconds', {
        p_user_id: user.id,
      })
      setStudySeconds(totalStudySeconds || 0)

      const { data: totalStudySecondsToday } = await supabase.rpc('total_study_seconds_today', {
        p_user_id: user.id,
      })
      setStudySecondsToday(totalStudySecondsToday || 0)

      setLoading(false)
    }

    load()
  }, [router])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    await supabase
      .from('profiles')
      .update({
        job_title: fields.job_title || null,
        company: fields.company || null,
        bio: fields.bio || null,
        linkedin_url: fields.linkedin_url || null,
      })
      .eq('id', user.id)

    setSaving(false)
    setEditing(false)
  }

  if (loading) return null

  const inProgress = courses.filter((c) => c.completedLessons < c.totalLessons)
  const completed = courses.filter((c) => c.totalLessons > 0 && c.completedLessons === c.totalLessons)

  const hasAnyDetails = fields.job_title || fields.company || fields.bio || fields.linkedin_url
  const coursesWithStudyTime = courses.filter((c) => (courseStudyTimes[c.course_id]?.totalSeconds || 0) > 0)

  return (
    <main className="max-w-3xl mx-auto py-16 px-4">
      <div className="rounded-xl bg-brand-surface p-6 mb-12">
        <div className="flex items-center justify-between gap-4 mb-1">
          <h1 className="text-3xl font-medium">
            {user?.user_metadata?.full_name || user?.email}
          </h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 whitespace-nowrap rounded-md border border-brand-muted/40 px-3 py-1.5 text-sm text-brand-secondary hover:border-brand-primary/50 hover:text-brand-primary transition"
            >
              {hasAnyDetails ? 'Edit details' : 'Add details'}
            </button>
          )}
        </div>
        <p className="text-brand-secondary text-sm">{user?.email}</p>
        <p className="text-brand-secondary text-sm mb-4">
          Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
        </p>

        {editing ? (
          <div className="space-y-3 mb-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Job title (optional)"
                value={fields.job_title}
                onChange={(e) => setFields({ ...fields, job_title: e.target.value })}
                className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface-raised text-sm"
              />
              <input
                type="text"
                placeholder="Company (optional)"
                value={fields.company}
                onChange={(e) => setFields({ ...fields, company: e.target.value })}
                className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface-raised text-sm"
              />
            </div>
            <input
              type="url"
              placeholder="LinkedIn URL (optional)"
              value={fields.linkedin_url}
              onChange={(e) => setFields({ ...fields, linkedin_url: e.target.value })}
              className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface-raised text-sm"
            />
            <textarea
              placeholder="Short bio (optional)"
              value={fields.bio}
              onChange={(e) => setFields({ ...fields, bio: e.target.value })}
              rows={3}
              className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface-raised text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-primary text-black px-5 py-2 rounded-md text-sm font-medium hover:bg-brand-primary-light transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-brand-secondary hover:text-brand-text transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {(fields.job_title || fields.company) && (
              <p className="text-sm mb-2">
                {fields.job_title}
                {fields.job_title && fields.company ? ' at ' : ''}
                {fields.company}
              </p>
            )}
            {fields.bio && <p className="text-sm text-brand-secondary mb-2">{fields.bio}</p>}
            {fields.linkedin_url && (
              <a
                href={fields.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-primary hover:underline"
              >
                LinkedIn ↗
              </a>
            )}
          </>
        )}

        <div className="flex gap-6 text-sm mt-4">
          <span><span className="text-brand-primary font-medium">{completed.length}</span> completed</span>
          <span><span className="text-brand-primary font-medium">{inProgress.length}</span> in progress</span>
          <span><span className="text-brand-primary font-medium">{formatStudyTime(studySeconds)}</span> studied</span>
        </div>
      </div>

      <div className="rounded-xl bg-brand-surface p-6 mb-12">
        <h2 className="text-sm text-brand-secondary mb-4">Study Stats</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg bg-brand-surface-raised p-4">
            <p className="text-2xl font-medium text-brand-primary">{formatStudyTime(studySecondsToday)}</p>
            <p className="text-xs text-brand-secondary mt-1">Studied today</p>
          </div>
          <div className="rounded-lg bg-brand-surface-raised p-4">
            <p className="text-2xl font-medium text-brand-primary">{formatStudyTime(studySeconds)}</p>
            <p className="text-xs text-brand-secondary mt-1">Total studied</p>
          </div>
        </div>

        {coursesWithStudyTime.length > 0 ? (
          <div className="space-y-2">
            {coursesWithStudyTime.map((c) => {
              const t = courseStudyTimes[c.course_id]
              return (
                <div key={c.course_id} className="flex items-center justify-between text-sm">
                  <span className="text-brand-text">{c.title}</span>
                  <span className="text-brand-secondary">
                    {formatStudyTime(t.totalSeconds)} total
                    {t.todaySeconds > 0 && <> · {formatStudyTime(t.todaySeconds)} today</>}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-brand-secondary text-sm">No study time recorded yet — open a lesson to get started.</p>
        )}
      </div>

      <h2 className="text-sm text-brand-secondary mb-4">In Progress</h2>
      {inProgress.length === 0 && (
        <p className="text-brand-secondary text-sm mb-10">Nothing in progress yet.</p>
      )}
      <div className="space-y-1 mb-12">
        {inProgress.map((c) => {
          const percent = c.totalLessons > 0
            ? Math.round((c.completedLessons / c.totalLessons) * 100)
            : 0
          return (
            <Link
              key={c.course_id}
              href={`/courses/${c.slug}`}
              className="flex items-center gap-5 rounded-xl bg-brand-surface hover:bg-brand-surface-raised transition p-5"
            >
              <div className="relative h-12 w-12 shrink-0 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(var(--color-brand-primary) ${percent * 3.6}deg, var(--color-brand-surface-raised) 0deg)`,
                }}
              >
                <div className="h-9 w-9 rounded-full bg-brand-surface flex items-center justify-center text-xs font-medium text-brand-primary">
                  {percent}%
                </div>
              </div>
              <div>
                <h3 className="font-medium">{c.title}</h3>
                <p className="text-sm text-brand-secondary">
                  {c.completedLessons} / {c.totalLessons} lessons complete
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <h2 className="text-sm text-brand-secondary mb-4">Completed</h2>
      {completed.length === 0 && (
        <p className="text-brand-secondary text-sm">No completed courses yet.</p>
      )}
      <div className="space-y-1">
        {completed.map((c) => (
          <Link
            key={c.course_id}
            href={`/courses/${c.slug}`}
            className="flex items-center justify-between rounded-xl bg-brand-surface hover:bg-brand-surface-raised transition p-5"
          >
            <h3 className="font-medium">{c.title}</h3>
            <span className="text-sm text-brand-primary">✓ Completed</span>
          </Link>
        ))}
      </div>
    </main>
  )
}