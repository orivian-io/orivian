import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Removes a course from the signed-in learner's courses (un-enroll).
// Progress, scores, notes and study time are kept by default, so enrolling
// again picks up where they left off. With clearProgress, the course is
// also reset first (same as the Reset course action). The user id always
// comes from the verified token, never the request body.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const courseId = typeof body?.courseId === 'string' ? body.courseId : null
  const clearProgress = body?.clearProgress === true
  const resetStudyTime = body?.resetStudyTime === true

  if (!courseId || !UUID.test(courseId)) {
    return NextResponse.json({ error: 'Invalid course' }, { status: 400 })
  }

  if (clearProgress) {
    const { error } = await supabaseAdmin.rpc('reset_learning_progress', {
      p_user_id: user.id,
      p_course_id: courseId,
      p_lesson_id: null,
      p_reset_study_time: resetStudyTime,
    })
    if (error) {
      return NextResponse.json({ error: 'Failed to clear progress' }, { status: 500 })
    }
  }

  const { error } = await supabaseAdmin
    .from('enrollments')
    .delete()
    .eq('user_id', user.id)
    .eq('course_id', courseId)

  if (error) {
    return NextResponse.json({ error: 'Failed to remove course' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
