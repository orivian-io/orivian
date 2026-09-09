import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// Returns a lesson's mini-exam questions WITHOUT correct answers.
// Only signed-in users can call this; the service role key (used via
// supabaseAdmin) reads the `questions` table directly since its RLS
// policy deliberately has no client-facing select rule.
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

  const { data: questions, error } = await supabaseAdmin
    .from('questions')
    .select('id, question_text, question_type, choices')
    .eq('lesson_id', lessonId)

  if (error) {
    return NextResponse.json({ error: 'Failed to load exam' }, { status: 500 })
  }
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions found for this lesson' }, { status: 404 })
  }

  // Shuffle so question order isn't identical every attempt.
  const shuffled = [...questions].sort(() => Math.random() - 0.5)

  return NextResponse.json({ questions: shuffled })
}