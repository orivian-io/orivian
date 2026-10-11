import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

const ADMIN_EMAIL = 'dan@orivian.io'

// Admin-only live activity: everyone who studied in the last 7 days, with
// real names and whether they've opted out of public views.
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin.rpc('admin_live_activity')
  if (error) {
    return NextResponse.json({ error: 'Failed to load live activity' }, { status: 500 })
  }
  return NextResponse.json(data)
}
