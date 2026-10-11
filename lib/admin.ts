'use client'

// Types and loader for the admin overview (see 0017_admin_overview_and_catalog.sql).

import { supabase } from '@/lib/supabase'

export type Person = { full_name: string | null; email: string | null; alias: string | null }

export type AdminOverview = {
  generated_at: string
  learners: {
    total: number
    new_7d: number
    new_30d: number
    active_1d: number
    active_7d: number
    active_30d: number
    ever_studied: number
    study_seconds: number
    lessons_completed: number
    lessons_7d: number
    exam_attempts_7d: number
    xp_awarded: number
  }
  daily: { day: string; signups: number; active: number; lessons: number }[]
  friends: {
    friendships: number
    pending: number
    requests_sent: number
    requests_accepted: number
    requests_7d: number
    via_invite: number
    learners_with_friends: number
    avg_friends: number | null
    most_connected: (Person & { friends: number; total_xp: number })[]
  }
  invites: {
    joined: number
    joined_7d: number
    qualified: number
    inviters: number
    xp_awarded: number
    top_inviters: (Person & { joined: number; qualified: number })[]
    recent: (Person & { invited_at: string | null; inviter_name: string | null; inviter_alias: string | null; qualified: boolean })[]
  }
  features: {
    alias_confirmed: number
    hidden: number
    avatar_chosen: number
    top_avatars: { avatar: string; n: number }[]
    notes: number
    note_takers: number
    streak_active: number
    levels: { label: string; n: number }[] | null
    located_sessions_7d: number
    sessions_7d: number
  }
  courses: {
    id: string
    title: string
    published: boolean
    lessons: number
    enrolled: number
    active_7d: number
    lessons_7d: number
    avg_progress: number | null
    finished: number
  }[]
  learner_list: (Person & {
    public: boolean
    avatar: string | null
    created_at: string
    last_seen: string | null
    total_xp: number
    level: number
    friends: number
    invited_by: string | null
    courses: number
    lessons: number
  })[]
}

export async function fetchAdminOverview(): Promise<AdminOverview | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  const res = await fetch('/api/admin/overview', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).catch(() => null)
  if (!res?.ok) return null
  return (await res.json().catch(() => null)) as AdminOverview | null
}

export function pctOf(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}
