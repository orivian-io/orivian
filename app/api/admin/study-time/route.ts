import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

const ADMIN_EMAIL = 'dan@orivian.io'

// Admin-only: lifetime study time per learner per course, including time
// learners have reset from their own timers (see admin_study_time()).
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin.rpc('admin_study_time')
  if (error) {
    return NextResponse.json({ error: 'Failed to load study time' }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [] })
}
