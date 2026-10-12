import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// "Report a problem" from lessons, quizzes, exams, results and course pages.
// Saves the report (0019_content_feedback.sql) and emails the admin through
// Resend when RESEND_API_KEY is set. Without the key, reports are still
// saved and appear on the admin page.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CONTEXTS = ['lesson', 'mini_exam', 'checkpoint', 'final_exam', 'results', 'course'] as const
const CATEGORIES = {
  wrong: 'Something is wrong',
  unclear: 'Hard to understand',
  typo: 'Typo or formatting',
  broken: "Something isn't working",
  suggestion: 'Suggestion',
  other: 'Other',
} as const
const CONTEXT_LABELS: Record<(typeof CONTEXTS)[number], string> = {
  lesson: 'Lesson slide',
  mini_exam: 'Mini-exam question',
  checkpoint: 'Checkpoint question',
  final_exam: 'Practice exam question',
  results: 'Results / explanation',
  course: 'Course',
}
const MAX_PER_HOUR = 15

const id = (v: unknown) => (typeof v === 'string' && UUID.test(v) ? v : null)
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user) return NextResponse.json({ error: 'Please log in to send a report.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const context = CONTEXTS.find((c) => c === body?.context)
  const category = (Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).find((c) => c === body?.category)
  if (!context || !category) return NextResponse.json({ error: 'Choose what kind of problem it is.' }, { status: 400 })

  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : ''
  if (category === 'other' && !message) {
    return NextResponse.json({ error: 'Add a few words about the problem.' }, { status: 400 })
  }

  const { count } = await supabaseAdmin
    .from('content_feedback')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gt('created_at', new Date(Date.now() - 3600_000).toISOString())
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json({ error: "You've sent a lot of reports this hour. Thank you! Try again a bit later." }, { status: 429 })
  }

  let courseId = id(body?.courseId)
  const lessonId = id(body?.lessonId)
  const sectionId = id(body?.sectionId)
  const finalExamId = id(body?.finalExamId)
  const questionId = id(body?.questionId)
  const blockIndex = Number.isInteger(body?.blockIndex) && body.blockIndex >= 0 ? body.blockIndex : null
  const pagePath = typeof body?.pagePath === 'string' && body.pagePath.startsWith('/') ? body.pagePath.slice(0, 300) : null

  // Look up titles (and the course) from the ids, so the report is readable.
  const [lesson, section, exam] = await Promise.all([
    lessonId
      ? supabaseAdmin.from('lessons').select('title, course_id, section_id').eq('id', lessonId).maybeSingle().then((r) => r.data)
      : null,
    sectionId ? supabaseAdmin.from('sections').select('title, course_id').eq('id', sectionId).maybeSingle().then((r) => r.data) : null,
    finalExamId
      ? supabaseAdmin.from('final_exams').select('title, course_id').eq('id', finalExamId).maybeSingle().then((r) => r.data)
      : null,
  ])
  courseId = courseId || lesson?.course_id || section?.course_id || exam?.course_id || null
  const course = courseId
    ? (await supabaseAdmin.from('courses').select('title, slug').eq('id', courseId).maybeSingle()).data
    : null

  // Question text comes from the database, not the browser.
  let snapshot = typeof body?.snapshot === 'string' ? body.snapshot.trim().slice(0, 1500) : ''
  if (questionId) {
    const q =
      (await supabaseAdmin.from('questions').select('question_text').eq('id', questionId).maybeSingle()).data ||
      (await supabaseAdmin.from('final_exam_questions').select('question_text').eq('id', questionId).maybeSingle()).data
    if (q?.question_text) snapshot = q.question_text + (snapshot && snapshot !== q.question_text ? `\n\n${snapshot}` : '')
  }

  const { data: saved, error } = await supabaseAdmin
    .from('content_feedback')
    .insert({
      user_id: user.id,
      context,
      category,
      message: message || null,
      course_id: courseId,
      lesson_id: lessonId,
      section_id: sectionId || lesson?.section_id || null,
      final_exam_id: finalExamId,
      question_id: questionId,
      block_index: blockIndex,
      snapshot: snapshot || null,
      page_path: pagePath,
    })
    .select('id')
    .single()

  if (error || !saved) {
    return NextResponse.json({ error: "Couldn't send your report. Try again." }, { status: 500 })
  }

  // Email the admin. Failures here never block the learner.
  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, display_name').eq('id', user.id).maybeSingle()
    const origin = req.nextUrl.origin
    const where = [
      course?.title,
      section?.title,
      lesson?.title,
      exam?.title,
      blockIndex !== null ? `slide ${blockIndex + 1}` : null,
    ].filter(Boolean) as string[]
    const subject = `[Orivian] ${CATEGORIES[category]}: ${where.slice(0, 3).join(' > ') || CONTEXT_LABELS[context]}`.slice(0, 150)
    const reporter = `${profile?.full_name || 'Learner'} (${profile?.display_name || 'no alias'}) <${user.email}>`
    const rows: [string, string][] = [
      ['Problem', CATEGORIES[category]],
      ['Where', `${CONTEXT_LABELS[context]}${where.length ? ` in ${where.join(' > ')}` : ''}`],
      ['Message', message || '(no message)'],
      ['What was on screen', snapshot || '(not captured)'],
      ['From', reporter],
    ]
    const html = `<div style="font-family:system-ui,sans-serif;max-width:620px">
<h2 style="margin:0 0 12px">New report: ${esc(CATEGORIES[category])}</h2>
<table style="border-collapse:collapse;width:100%">${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:8px 12px 8px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;white-space:pre-wrap">${esc(v)}</td></tr>`,
      )
      .join('')}</table>
<p style="margin-top:16px">${pagePath ? `<a href="${esc(origin + pagePath)}">Open the page</a> &nbsp;|&nbsp; ` : ''}<a href="${esc(origin)}/admin#feedback">Review in admin</a></p></div>`
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n\n') + `\n\nReview: ${origin}/admin#feedback`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FEEDBACK_FROM_EMAIL || 'Orivian Feedback <feedback@orivian.io>',
        to: [process.env.FEEDBACK_NOTIFY_EMAIL || 'dan@orivian.io'],
        reply_to: user.email || undefined,
        subject,
        html,
        text,
      }),
    }).catch(() => null)
    if (res?.ok) await supabaseAdmin.from('content_feedback').update({ emailed: true }).eq('id', saved.id)
  }

  return NextResponse.json({ ok: true })
}
