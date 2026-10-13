'use client'

import { supabase } from '@/lib/supabase'

// Learner-facing study time stats, built from the learner's own
// study_sessions rows (the same heartbeat-tracked time that drives the
// lesson timer). Each session counts toward the day it started on, in the
// learner's own timezone.

export type StudyDay = { day: string; seconds: number }
export type StudyWeek = { weekStart: string; seconds: number }
export type StudyCourse = { courseId: string; title: string; slug: string | null; seconds: number }

export type StudyTime = {
  today: number
  thisWeek: number
  lastWeek: number
  last7Avg: number
  allTime: number
  activeDays30: number
  days: StudyDay[] // last 30 days, oldest first, including empty days
  weeks: StudyWeek[] // last 12 weeks (Monday start), oldest first
  courses: StudyCourse[] // all-time, most studied first
}

type Row = { started_at: string | null; last_heartbeat_at: string | null; duration_seconds: number; lesson_id: string | null }

const PAGE = 1000
const MAX_ROWS = 20000

function dayIn(iso: string, tz: string) {
  try {
    return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz })
  } catch {
    return new Date(iso).toLocaleDateString('en-CA')
  }
}

export function shiftDay(ymd: string, delta: number) {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

// Monday of the week containing ymd.
export function weekStartOf(ymd: string) {
  const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay() // 0 = Sunday
  return shiftDay(ymd, -((dow + 6) % 7))
}

export async function fetchStudyTime(userId: string, tz: string, today: string): Promise<StudyTime> {
  const rows: Row[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('started_at, last_heartbeat_at, duration_seconds, lesson_id')
      .eq('user_id', userId)
      .gt('duration_seconds', 0)
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...((data || []) as Row[]))
    if (!data || data.length < PAGE) break
  }

  // Sessions are recorded per lesson; look up each lesson's course.
  const lessonIds = [...new Set(rows.map((r) => r.lesson_id).filter((id): id is string => !!id))]
  const courseByLesson = new Map<string, string>()
  for (let i = 0; i < lessonIds.length; i += 200) {
    const { data } = await supabase.from('lessons').select('id, course_id').in('id', lessonIds.slice(i, i + 200))
    for (const l of data || []) if (l.course_id) courseByLesson.set(l.id, l.course_id)
  }

  const byDay = new Map<string, number>()
  const byCourse = new Map<string, number>()
  let allTime = 0
  for (const r of rows) {
    const at = r.started_at || r.last_heartbeat_at
    if (!at) continue
    const secs = r.duration_seconds || 0
    allTime += secs
    const day = dayIn(at, tz)
    byDay.set(day, (byDay.get(day) || 0) + secs)
    const courseId = r.lesson_id ? courseByLesson.get(r.lesson_id) : undefined
    if (courseId) byCourse.set(courseId, (byCourse.get(courseId) || 0) + secs)
  }

  const days: StudyDay[] = Array.from({ length: 30 }, (_, i) => {
    const day = shiftDay(today, i - 29)
    return { day, seconds: byDay.get(day) || 0 }
  })

  const thisWeekStart = weekStartOf(today)
  const weeks: StudyWeek[] = Array.from({ length: 12 }, (_, i) => ({
    weekStart: shiftDay(thisWeekStart, (i - 11) * 7),
    seconds: 0,
  }))
  const weekIndex = new Map(weeks.map((w, i) => [w.weekStart, i]))
  for (const [day, secs] of byDay) {
    const i = weekIndex.get(weekStartOf(day))
    if (i !== undefined) weeks[i].seconds += secs
  }

  const last7 = days.slice(-7).reduce((sum, d) => sum + d.seconds, 0)

  let courses: StudyCourse[] = []
  if (byCourse.size > 0) {
    const { data: courseRows } = await supabase
      .from('courses')
      .select('id, title, slug')
      .in('id', [...byCourse.keys()])
    const info = new Map((courseRows || []).map((c) => [c.id, c]))
    courses = [...byCourse.entries()]
      .map(([courseId, seconds]) => ({
        courseId,
        seconds,
        title: info.get(courseId)?.title || 'Course',
        slug: info.get(courseId)?.slug || null,
      }))
      .sort((a, b) => b.seconds - a.seconds)
  }

  return {
    today: byDay.get(today) || 0,
    thisWeek: weeks[11].seconds,
    lastWeek: weeks[10].seconds,
    last7Avg: Math.round(last7 / 7),
    allTime,
    activeDays30: days.filter((d) => d.seconds >= 60).length,
    days,
    weeks,
    courses,
  }
}

// "2h 05m", "42m", "<1m", "0m"
export function formatStudyTime(seconds: number): string {
  if (seconds <= 0) return '0m'
  if (seconds < 60) return '<1m'
  const totalMinutes = Math.round(seconds / 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}
