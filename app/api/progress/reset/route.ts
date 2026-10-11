import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Resets the signed-in learner's own progress for a course or a single
// lesson. With resetStudyTime, their study time for it moves to an archive:
// the learner's timers start from zero, while admin reporting keeps the
// lifetime total. The user id always comes from the verified token, never
// the request body, so a learner can only ever reset their own progress.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const courseId = typeof body?.courseId === 'string' ? body.courseId : null
  const lessonId = typeof body?.lessonId === 'string' ? body.lessonId : null
  const resetStudyTime = body?.resetStudyTime === true

  if ((!courseId && !lessonId) || (courseId && lessonId)) {
    return NextResponse.json({ error: 'Pass either courseId or lessonId' }, { status: 400 })
  }
  if ((courseId && !UUID.test(courseId)) || (lessonId && !UUID.test(lessonId))) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.rpc('reset_learning_progress', {
    p_user_id: user.id,
    p_course_id: courseId,
    p_lesson_id: lessonId,
    p_reset_study_time: resetStudyTime,
  })

  if (error) {
    const notFound = /not found/i.test(error.message)
    return NextResponse.json(
      { error: notFound ? 'Course or lesson not found' : 'Failed to reset progress' },
      { status: notFound ? 404 : 500 },
    )
  }

  return NextResponse.json({ ok: true, ...(data as object) })
}
