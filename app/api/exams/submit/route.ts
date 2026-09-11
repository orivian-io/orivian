import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// Passing threshold for lesson mini-exams AND full-domain checkpoint exams.
// Adjustable - not discussed with the user yet beyond "must pass to
// complete a lesson", so this is a reasonable default (stricter than
// CISSP's own ~70% scaled passing score, since these are formative checks,
// not the real exam).
const PASS_THRESHOLD_PERCENT = 80

type SubmittedAnswer = {
  questionId: string
  selectedChoiceIds: string[]
}

// Grades a submitted mini-exam OR checkpoint attempt server-side and
// records it. A passed mini-exam additionally marks its lesson complete;
// a checkpoint attempt is recorded against the section only - checkpoints
// don't gate lesson completion or factor into section_mastery, they're a
// capstone assessment layered on top. Correct answers never appear in the
// request/response until after grading has already happened.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const lessonId = body?.lessonId
  const sectionId = body?.sectionId
  const answers: SubmittedAnswer[] = body?.answers
  const isCheckpoint = !!sectionId

  if ((!lessonId && !sectionId) || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'lessonId or sectionId, and answers, are required' }, { status: 400 })
  }

  const { data: questions, error: qErr } = isCheckpoint
    ? await supabaseAdmin
        .from('questions')
        .select('id, correct_choice_ids, explanation')
        .eq('section_id', sectionId)
        .is('lesson_id', null)
    : await supabaseAdmin
        .from('questions')
        .select('id, correct_choice_ids, explanation')
        .eq('lesson_id', lessonId)

  if (qErr || !questions || questions.length === 0) {
    return NextResponse.json({
      error: isCheckpoint ? 'No checkpoint questions found for this section' : 'No questions found for this lesson',
    }, { status: 404 })
  }

  const correctByQuestion = new Map<string, Set<string>>(
    questions.map((q) => [q.id, new Set(q.correct_choice_ids as string[])])
  )

  let correctCount = 0
  const gradedAnswers = answers.map((a) => {
    const correctSet = correctByQuestion.get(a.questionId)
    const selected = new Set(a.selectedChoiceIds || [])
    const isCorrect =
      !!correctSet &&
      correctSet.size === selected.size &&
      [...correctSet].every((id) => selected.has(id))

    if (isCorrect) correctCount++

    return {
      question_id: a.questionId,
      selected_choice_ids: a.selectedChoiceIds || [],
      correct: isCorrect,
    }
  })

  const questionCount = questions.length
  const scorePercent = Math.round((correctCount / questionCount) * 1000) / 10
  const passed = scorePercent >= PASS_THRESHOLD_PERCENT

  const { data: attempt, error: attemptErr } = await supabaseAdmin
    .from('exam_attempts')
    .insert({
      user_id: user.id,
      lesson_id: isCheckpoint ? null : lessonId,
      section_id: isCheckpoint ? sectionId : null,
      attempt_type: isCheckpoint ? 'section_exam' : 'mini_exam',
      question_count: questionCount,
      score_percent: scorePercent,
      passed,
    })
    .select()
    .single()

  if (attemptErr || !attempt) {
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 })
  }

  await supabaseAdmin
    .from('exam_attempt_answers')
    .insert(gradedAnswers.map((a) => ({ ...a, attempt_id: attempt.id })))

  if (passed && !isCheckpoint) {
    // Mirrors the existing app's delete-then-insert pattern for progress
    // (see toggleComplete in app/courses/[slug]/page.tsx) rather than an
    // upsert, since we can't assume a unique constraint exists yet.
    await supabaseAdmin.from('progress').delete().eq('user_id', user.id).eq('lesson_id', lessonId)
    await supabaseAdmin.from('progress').insert({
      user_id: user.id,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
      passing_attempt_id: attempt.id,
    })
  }

  const explanationByQuestion = new Map(questions.map((q) => [q.id, q.explanation]))

  return NextResponse.json({
    scorePercent,
    passed,
    correctCount,
    questionCount,
    passThreshold: PASS_THRESHOLD_PERCENT,
    results: gradedAnswers.map((a) => ({
      questionId: a.question_id,
      correct: a.correct,
      explanation: explanationByQuestion.get(a.question_id) || null,
    })),
  })
}