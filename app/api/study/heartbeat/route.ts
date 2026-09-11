import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// Caps how much time a single heartbeat can add, so a missed heartbeat
// (tab backgrounded, laptop asleep, network hiccup) can't be misread as
// hours of continuous study once it resumes.
const MAX_SECONDS_PER_HEARTBEAT = 60

type CourseStudyBreakdown = { total: number; today: number } | null

async function getCourseStudyBreakdown(userId: string, lessonId: string): Promise<CourseStudyBreakdown> {
  const { data: lessonRow } = await supabaseAdmin
    .from('lessons')
    .select('course_id')
    .eq('id', lessonId)
    .maybeSingle()

  if (!lessonRow?.course_id) return null

  const { data } = await supabaseAdmin.rpc('course_study_breakdown', {
    p_user_id: userId,
    p_course_id: lessonRow.course_id,
  })

  // A set-returning SQL function comes back as an array of rows.
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null

  return {
    total: typeof row.total_seconds === 'number' ? row.total_seconds : 0,
    today: typeof row.today_seconds === 'number' ? row.today_seconds : 0,
  }
}

// Called roughly every 20s by the lesson player while it's visible and
// focused. Accumulates real study time server-side - a user can't
// fabricate hours by calling this directly, since each call can only
// ever add up to MAX_SECONDS_PER_HEARTBEAT regardless of what's claimed.
//
// Also returns courseStudySecondsTotal / courseStudySecondsToday - the
// learner's authoritative study time across every lesson in this
// lesson's course, all-time and just for today - so the lesson player
// can show live, un-fakeable timers that stay in sync with the server.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const lessonId = body?.lessonId
  const clientSessionId = body?.clientSessionId

  if (!lessonId || !clientSessionId) {
    return NextResponse.json({ error: 'lessonId and clientSessionId are required' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('study_sessions')
    .select('id, last_heartbeat_at, duration_seconds')
    .eq('user_id', user.id)
    .eq('client_session_id', clientSessionId)
    .maybeSingle()

  const now = new Date()

  if (!existing) {
    const { error } = await supabaseAdmin.from('study_sessions').insert({
      user_id: user.id,
      lesson_id: lessonId,
      client_session_id: clientSessionId,
      started_at: now.toISOString(),
      last_heartbeat_at: now.toISOString(),
      duration_seconds: 0,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to start study session' }, { status: 500 })
    }

    const breakdown = await getCourseStudyBreakdown(user.id, lessonId)
    return NextResponse.json({
      totalDurationSeconds: 0,
      courseStudySecondsTotal: breakdown?.total ?? null,
      courseStudySecondsToday: breakdown?.today ?? null,
    })
  }

  const rawElapsedSeconds = Math.round(
    (now.getTime() - new Date(existing.last_heartbeat_at).getTime()) / 1000
  )
  const elapsedSeconds = Math.max(0, Math.min(MAX_SECONDS_PER_HEARTBEAT, rawElapsedSeconds))
  const newDuration = existing.duration_seconds + elapsedSeconds

  const { error } = await supabaseAdmin
    .from('study_sessions')
    .update({ last_heartbeat_at: now.toISOString(), duration_seconds: newDuration })
    .eq('id', existing.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update study session' }, { status: 500 })
  }

  const breakdown = await getCourseStudyBreakdown(user.id, lessonId)
  return NextResponse.json({
    totalDurationSeconds: newDuration,
    courseStudySecondsTotal: breakdown?.total ?? null,
    courseStudySecondsToday: breakdown?.today ?? null,
  })
}