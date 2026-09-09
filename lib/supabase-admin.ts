import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Server-only Supabase client using the service role key, which bypasses
 * Row Level Security entirely.
 *
 * NEVER import this file from a 'use client' component, a client-side hook,
 * or anything else that ships to the browser. It must only be used inside
 * Next.js Route Handlers (app/api/--/route.ts) or other server-only code.
 * Exposing SUPABASE_SERVICE_ROLE_KEY to the browser grants full read/write
 * access to every table regardless of RLS policies.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})