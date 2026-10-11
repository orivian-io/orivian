'use client'

// Data for the signed-in home page: each enrolled course with its next
// lesson, ordered by what the learner touched most recently.

import { supabase } from '@/lib/supabase'

export type NextLesson = {
  id: string
  title: string
  section: string | null
  minutes: number
  questions: number
  type: string
  started: boolean // they've been inside it but haven't finished
}

export type HomeCourse = {
  id: string
  slug: string
  title: string
  total: number
  completed: number
  lastActive: string | null
  next: NextLesson | null
}

export type HomeData = {
  enrolled: HomeCourse[]
  explore: { slug: string; title: string; description: string }[]
}

type LessonRow = {
  id: string
  course_id: string
  section_id: string | null
  title: string
  order_index: number
  estimated_minutes: number | null
  lesson_type: string
}

// PostgREST returns at most 1,000 rows per request, so page through.
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>) {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data } = await page(from, from + 999)
    if (!data) break
    out.push(...data)
    if (data.length < 1000) break
  }
  return out
}

const MINUTES_PER_QUESTION = 0.75 // same estimate as the course page

const latest = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b)

export async function loadHome(userId: string): Promise<HomeData> {
  const [{ data: courses }, { data: enrollments }] = await Promise.all([
    supabase.from('courses').select('id, slug, title, description').eq('published', true),
    supabase.from('enrollments').select('course_id').eq('user_id', userId),
  ])

  const enrolledIds = new Set((enrollments || []).map((e) => e.course_id as string))
  const mine = (courses || []).filter((c) => enrolledIds.has(c.id))
  const explore = (courses || [])
    .filter((c) => !enrolledIds.has(c.id))
    .map((c) => ({ slug: c.slug, title: c.title, description: c.description }))

  if (mine.length === 0) return { enrolled: [], explore }
  const courseIds = mine.map((c) => c.id)

  const [sections, lessons, progress, sessions] = await Promise.all([
    fetchAll<{ id: string; title: string; order_index: number }>((a, b) =>
      supabase.from('sections').select('id, title, order_index').in('course_id', courseIds).range(a, b),
    ),
    fetchAll<LessonRow>((a, b) =>
      supabase
        .from('lessons')
        .select('id, course_id, section_id, title, order_index, estimated_minutes, lesson_type')
        .in('course_id', courseIds)
        .range(a, b),
    ),
    fetchAll<{ lesson_id: string; completed_at: string }>((a, b) =>
      supabase.from('progress').select('lesson_id, completed_at').eq('user_id', userId).range(a, b),
    ),
    supabase
      .from('study_sessions')
      .select('lesson_id, last_heartbeat_at')
      .eq('user_id', userId)
      .not('lesson_id', 'is', null)
      .order('last_heartbeat_at', { ascending: false })
      .limit(500)
      .then(({ data }) => (data || []) as { lesson_id: string; last_heartbeat_at: string }[]),
  ])

  const sectionById = new Map(sections.map((s) => [s.id, s]))
  const done = new Map(progress.map((p) => [p.lesson_id, p.completed_at]))
  const lastSeen = new Map<string, string>()
  for (const s of sessions) if (!lastSeen.has(s.lesson_id)) lastSeen.set(s.lesson_id, s.last_heartbeat_at)

  const sectionOrder = (l: LessonRow) => (l.section_id ? (sectionById.get(l.section_id)?.order_index ?? 0) : -1)

  const result: (HomeCourse & { nextRow: LessonRow | null })[] = mine.map((c) => {
    const list = lessons
      .filter((l) => l.course_id === c.id)
      .sort((a, b) => sectionOrder(a) - sectionOrder(b) || a.order_index - b.order_index)

    let lastActive: string | null = null
    let lastTouchedOpen: { row: LessonRow; at: string } | null = null
    for (const l of list) {
      lastActive = latest(lastActive, done.get(l.id) ?? null)
      const seen = lastSeen.get(l.id) ?? null
      lastActive = latest(lastActive, seen)
      if (seen && !done.has(l.id) && (!lastTouchedOpen || seen > lastTouchedOpen.at)) lastTouchedOpen = { row: l, at: seen }
    }

    // Resume the lesson they were last inside; otherwise the first one
    // they haven't finished.
    const nextRow = lastTouchedOpen?.row ?? list.find((l) => !done.has(l.id)) ?? null

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      total: list.length,
      completed: list.filter((l) => done.has(l.id)).length,
      lastActive,
      next: null,
      nextRow,
    }
  })

  const nextIds = result.map((r) => r.nextRow?.id).filter((id): id is string => !!id)
  const { data: qs } = nextIds.length
    ? await supabase.from('questions').select('lesson_id').in('lesson_id', nextIds)
    : { data: [] as { lesson_id: string }[] }
  const qCount = new Map<string, number>()
  for (const q of qs || []) qCount.set(q.lesson_id, (qCount.get(q.lesson_id) || 0) + 1)

  const enrolled = result
    .map(({ nextRow, ...c }) => {
      if (!nextRow) return c
      const questions = qCount.get(nextRow.id) || 0
      return {
        ...c,
        next: {
          id: nextRow.id,
          title: nextRow.title,
          section: nextRow.section_id ? (sectionById.get(nextRow.section_id)?.title ?? null) : null,
          minutes: Math.round((nextRow.estimated_minutes || 0) + questions * MINUTES_PER_QUESTION),
          questions,
          type: nextRow.lesson_type,
          started: lastSeen.has(nextRow.id),
        },
      }
    })
    .sort((a, b) => {
      // Most recently active first; untouched courses after, by title.
      if (a.lastActive && b.lastActive) return b.lastActive.localeCompare(a.lastActive)
      if (a.lastActive) return -1
      if (b.lastActive) return 1
      return a.title.localeCompare(b.title)
    })

  return { enrolled, explore }
}
