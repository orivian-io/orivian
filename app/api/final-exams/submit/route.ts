import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// The passing threshold and scoring disclaimer are per-exam data
// (`final_exams.pass_threshold_percent` / `.scoring_disclaimer`), not
// hardcoded here - different courses have different certifying bodies with
// different passing scores and scoring models (e.g. CompTIA's SY0-701 vs.
// ISC2's CISSP), so a new course only ever needs the right data on its
// exam row, never a code change in this route. This constant is a
// last-resort fallback for the rare case an exam row has no disclaimer set.
const DEFAULT_SCORING_DISCLAIMER =
  "This score is a straight percentage of questions answered correctly and may not exactly match how the real certification exam is scored."

type SubmittedAnswer = {
  questionId: string
  selectedChoiceIds: string[]
}

// Grades a submitted Final Exam attempt server-side and records it. Not
// gating - unlike a lesson mini-exam, passing a Final Exam doesn't mark
// anything complete and doesn't feed section_mastery, same as Domain
// Checkpoints. `startedAt` is the timestamp /api/final-exams/start issued
// (server clock, not client-supplied at that point), echoed back here so
// elapsed time and whether the learner finished within the exam's time
// limit can be computed and shown - informationally only. Going over the
// limit never blocks submission.
export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const examId = body?.examId
  const startedAtRaw = body?.startedAt
  const answers: SubmittedAnswer[] = body?.answers

  if (!examId || typeof examId !== 'string' || !startedAtRaw || !Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'examId, startedAt, and answers are required' }, { status: 400 })
  }

  const startedAtMs = Date.parse(startedAtRaw)
  if (Number.isNaN(startedAtMs)) {
    return NextResponse.json({ error: 'Invalid startedAt' }, { status: 400 })
  }

  const { data: exam, error: examErr } = await supabaseAdmin
    .from('final_exams')
    .select('id, time_limit_minutes, pass_threshold_percent, scoring_disclaimer')
    .eq('id', examId)
    .single()

  if (examErr || !exam) {
    return NextResponse.json({ error: 'Final exam not found' }, { status: 404 })
  }

  const { data: questions, error: qErr } = await supabaseAdmin
    .from('final_exam_questions')
    .select('id, correct_choice_ids, explanation')
    .eq('final_exam_id', examId)

  if (qErr || !questions || questions.length === 0) {
    return NextResponse.json({ error: 'This exam has no questions yet' }, { status: 404 })
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
  // Fall back to 70 only if this exam's row somehow has no threshold set
  // (shouldn't happen - the content pipeline always sets one).
  const passThreshold = exam.pass_threshold_percent ?? 70
  const passed = scorePercent >= passThreshold

  const completedAtMs = Date.now()
  const elapsedSeconds = Math.max(0, Math.round((completedAtMs - startedAtMs) / 1000))
  const timeLimitSeconds = exam.time_limit_minutes * 60
  const withinTimeLimit = elapsedSeconds <= timeLimitSeconds

  const { data: attempt, error: attemptErr } = await supabaseAdmin
    .from('exam_attempts')
    .insert({
      user_id: user.id,
      lesson_id: null,
      section_id: null,
      final_exam_id: examId,
      attempt_type: 'final_exam',
      question_count: questionCount,
      score_percent: scorePercent,
      passed,
      started_at: new Date(startedAtMs).toISOString(),
      completed_at: new Date(completedAtMs).toISOString(),
      elapsed_seconds: elapsedSeconds,
      within_time_limit: withinTimeLimit,
    })
    .select()
    .single()

  if (attemptErr || !attempt) {
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 })
  }

  await supabaseAdmin
    .from('final_exam_attempt_answers')
    .insert(gradedAnswers.map((a) => ({ ...a, attempt_id: attempt.id })))

  const explanationByQuestion = new Map(questions.map((q) => [q.id, q.explanation]))

  return NextResponse.json({
    scorePercent,
    passed,
    correctCount,
    questionCount,
    passThreshold,
    elapsedSeconds,
    timeLimitSeconds,
    withinTimeLimit,
    scoringDisclaimer: exam.scoring_disclaimer || DEFAULT_SCORING_DISCLAIMER,
    results: gradedAnswers.map((a) => ({
      questionId: a.question_id,
      correct: a.correct,
      explanation: explanationByQuestion.get(a.question_id) || null,
    })),
  })
}