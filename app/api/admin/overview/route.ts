import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

const ADMIN_EMAIL = 'dan@orivian.io'

// Admin-only: platform-wide numbers for the admin page (see admin_overview()
// in 0017). Includes real names and emails, so it never leaves the server
// for anyone but the admin.
export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req)
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin.rpc('admin_overview')
  if (error) {
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 })
  }
  return NextResponse.json(data)
}
