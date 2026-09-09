import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Verifies the caller's Supabase access token (sent as `Authorization: Bearer <token>`)
 * and returns the authenticated user, or null if the token is missing/invalid.
 *
 * This runs server-side and re-validates the token against Supabase Auth on
 * every call - the user id is never trusted from the request body, since a
 * client could otherwise claim to be any user.
 */
export async function getAuthedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}