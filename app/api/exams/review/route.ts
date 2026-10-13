import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// Returns the signed-in learner's past mini-exam attempts for one lesson,
// newest first, with every question, what they picked, the correct
// answer(s), and the explanation - so they can go back and review what they
// missed. Only the caller's own attempts are ever returned, and a question's
// answer key is only included for questions the learner has already
// answered in an attempt.
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

  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('id, title, courses(slug, title)')
    .eq('id', lessonId)
    .single()

  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const { data: attempts, error: attemptsErr } = await supabaseAdmin
    .from('exam_attempts')
    .select('id, score_percent, passed, question_count, completed_at')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .eq('attempt_type', 'mini_exam')
    .order('completed_at', { ascending: false })
    .limit(20)

  if (attemptsErr) {
    return NextResponse.json({ error: 'Failed to load attempts' }, { status: 500 })
  }

  const course = Array.isArray(lesson.courses) ? lesson.courses[0] : lesson.courses
  const lessonInfo = { id: lesson.id, title: lesson.title, course: course || null }

  if (!attempts || attempts.length === 0) {
    return NextResponse.json({ lesson: lessonInfo, attempts: [] })
  }

  const { data: answers, error: answersErr } = await supabaseAdmin
    .from('exam_attempt_answers')
    .select('attempt_id, question_id, selected_choice_ids, correct')
    .in('attempt_id', attempts.map((a) => a.id))

  if (answersErr) {
    return NextResponse.json({ error: 'Failed to load answers' }, { status: 500 })
  }

  const questionIds = [...new Set((answers || []).map((a) => a.question_id))]
  const { data: questions } = questionIds.length
    ? await supabaseAdmin
        .from('questions')
        .select('id, question_text, question_type, choices, correct_choice_ids, explanation')
        .in('id', questionIds)
    : { data: [] }

  const questionById = new Map((questions || []).map((q) => [q.id, q]))

  return NextResponse.json({
    lesson: lessonInfo,
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      scorePercent: Number(attempt.score_percent),
      passed: attempt.passed,
      questionCount: attempt.question_count,
      completedAt: attempt.completed_at,
      answers: (answers || [])
        .filter((a) => a.attempt_id === attempt.id)
        .map((a) => {
          const q = questionById.get(a.question_id)
          if (!q) return null
          return {
            questionId: q.id,
            questionText: q.question_text,
            questionType: q.question_type,
            choices: q.choices as { id: string; text: string }[],
            selectedChoiceIds: (a.selected_choice_ids as string[]) || [],
            correctChoiceIds: (q.correct_choice_ids as string[]) || [],
            correct: a.correct,
            explanation: q.explanation,
          }
        })
        .filter((a) => a !== null),
    })),
  })
}
