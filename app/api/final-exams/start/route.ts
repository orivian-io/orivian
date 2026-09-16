import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// Returns a Final Exam's questions (without correct answers), plus the
// exam's time limit and a server-issued `startedAt` timestamp. The client
// never supplies its own start time - the server's clock is authoritative,
// so there's no clock-skew or spoofing concern when it's echoed back on
// submit to compute elapsed time.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const examId = body?.examId

  if (!examId || typeof examId !== 'string') {
    return NextResponse.json({ error: 'examId is required' }, { status: 400 })
  }

  const { data: exam, error: examErr } = await supabaseAdmin
    .from('final_exams')
    .select('id, title, time_limit_minutes, question_count')
    .eq('id', examId)
    .single()

  if (examErr || !exam) {
    return NextResponse.json({ error: 'Final exam not found' }, { status: 404 })
  }

  const { data: questions, error } = await supabaseAdmin
    .from('final_exam_questions')
    .select('id, question_text, question_type, choices')
    .eq('final_exam_id', examId)

  if (error) {
    return NextResponse.json({ error: 'Failed to load exam' }, { status: 500 })
  }
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'This exam has no questions yet' }, { status: 404 })
  }

  // Shuffle so question order isn't identical every attempt.
  const shuffled = [...questions].sort(() => Math.random() - 0.5)

  return NextResponse.json({
    questions: shuffled,
    timeLimitMinutes: exam.time_limit_minutes,
    startedAt: new Date().toISOString(),
  })
}