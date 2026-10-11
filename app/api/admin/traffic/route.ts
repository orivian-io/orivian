import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

const ADMIN_EMAIL = 'dan@orivian.io'

// Admin-only: site traffic for the last N days (see admin_traffic() in 0018).
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const days = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get('days')) || 30))
  const { data, error } = await supabaseAdmin.rpc('admin_traffic', { p_days: days })
  if (error) {
    return NextResponse.json({ error: 'Failed to load traffic' }, { status: 500 })
  }
  return NextResponse.json(data)
}
