import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

const ADMIN_EMAIL = 'dan@orivian.io'
const STATUSES = ['new', 'reviewing', 'fixed', 'wont_fix'] as const

async function requireAdmin(req: NextRequest) {
  const user = await getAuthedUser(req)
  return user && user.email === ADMIN_EMAIL ? user : null
}

// Admin-only: content reports. ?count=1 returns just the number of new
// reports (navbar badge); ?status=open|all lists them.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  if (req.nextUrl.searchParams.get('count')) {
    const { count } = await supabaseAdmin
      .from('content_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
    return NextResponse.json({ new: count ?? 0 })
  }

  let query = supabaseAdmin
    .from('content_feedback')
    .select('*, courses(title, slug), lessons(title), sections(title)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (req.nextUrl.searchParams.get('status') !== 'all') query = query.in('status', ['new', 'reviewing'])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 })

  // Reporter names, and practice-exam titles (no foreign key to join on).
  const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))]
  const examIds = [...new Set((data || []).map((r) => r.final_exam_id).filter(Boolean))]
  const [{ data: people }, { data: exams }] = await Promise.all([
    userIds.length
      ? supabaseAdmin.from('profiles').select('id, full_name, email, display_name').in('id', userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null; display_name: string | null }[] }),
    examIds.length
      ? supabaseAdmin.from('final_exams').select('id, title').in('id', examIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ])
  const personById = new Map((people || []).map((p) => [p.id, p]))
  const examById = new Map((exams || []).map((e) => [e.id, e.title]))

  const { count: open } = await supabaseAdmin
    .from('content_feedback')
    .select('id', { count: 'exact', head: true })
    .in('status', ['new', 'reviewing'])

  return NextResponse.json({
    open: open ?? 0,
    rows: (data || []).map((r) => ({
      ...r,
      reporter: r.user_id ? personById.get(r.user_id) ?? null : null,
      final_exam_title: r.final_exam_id ? examById.get(r.final_exam_id) ?? null : null,
    })),
  })
}

// Update a report's status and/or note.
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : null
  const status = STATUSES.find((s) => s === body?.status)
  const note = typeof body?.admin_note === 'string' ? body.admin_note.slice(0, 2000) : undefined
  if (!id || (!status && note === undefined)) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (status) {
    update.status = status
    update.resolved_at = status === 'fixed' || status === 'wont_fix' ? new Date().toISOString() : null
  }
  if (note !== undefined) update.admin_note = note || null

  const { error } = await supabaseAdmin.from('content_feedback').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
