import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// Marks a domain-recap lesson as reviewed. Recap lessons (lessons.lesson_type
// = 'recap') have no mini-exam, so there's no grading step to gate
// completion on - reaching the end of the recap's content is enough. This
// still goes through a server route rather than a client-side insert so we
// can verify the lesson really is a recap before writing progress,
// consistent with how every other progress-affecting write in this app
// goes through the service role key rather than a direct client write.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const lessonId = body?.lessonId

  if (!lessonId || typeof lessonId !== 'string') {
    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
  }

  const { data: lesson, error: lessonErr } = await supabaseAdmin
    .from('lessons')
    .select('id, lesson_type')
    .eq('id', lessonId)
    .single()

  if (lessonErr || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
  if (lesson.lesson_type !== 'recap') {
    return NextResponse.json({ error: 'This lesson requires passing its mini-exam to complete' }, { status: 400 })
  }

  // Mirrors the existing app's delete-then-insert pattern for progress
  // (see toggleComplete in app/courses/[slug]/page.tsx and the mini-exam
  // submit route) rather than an upsert, since we can't assume a unique
  // constraint exists yet.
  await supabaseAdmin.from('progress').delete().eq('user_id', user.id).eq('lesson_id', lessonId)
  await supabaseAdmin.from('progress').insert({
    user_id: user.id,
    lesson_id: lessonId,
    completed_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}