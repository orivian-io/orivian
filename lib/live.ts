'use client'

// Live study activity (see 0014_live_activity_and_aliases.sql).

import { supabase } from '@/lib/supabase'

export type LivePerson = {
  alias: string
  avatar: string | null
  total_xp: number
  course: string | null
  last_seen: string
  is_you?: boolean
}

export type MapRegion = { key: string; now: number; day: number; week: number; month?: number }

export type LiveActivity = {
  generated_at: string
  active_now: LivePerson[]
  active_hidden: number
  recent: LivePerson[]
  recent_hidden: number
  totals: { now: number; day: number; week: number }
  map: MapRegion[]
}

export type AdminPerson = {
  full_name: string | null
  email: string | null
  alias: string | null
  avatar: string | null
  public: boolean
  course: string | null
  region: string | null
  last_seen: string
  total_xp: number
}

export type AdminLiveActivity = { generated_at: string; people: AdminPerson[]; map: MapRegion[] }

// Anonymous, aggregate activity for signed-out visitors (0015).
export type PulseItem = { at: string; lesson: string; course: string; course_slug: string | null; place: string | null }

export type PublicPulse = {
  generated_at: string
  totals: { now: number; day: number; week: number; month: number; countries: number; lessons_week: number }
  map: MapRegion[]
  feed: PulseItem[]
}

export async function fetchPublicPulse(): Promise<PublicPulse | null> {
  const { data, error } = await supabase.rpc('public_activity_pulse')
  if (error || !data) return null
  return data as PublicPulse
}

// "Texas" / "Germany" for a map key like US-TX or DE.
export function placeName(key: string | null | undefined, names?: Record<string, string>): string | null {
  if (!key) return null
  if (key.startsWith('US-')) return names?.[key] || US_STATES[key.slice(3)] || key.slice(3)
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(key) || names?.[key] || key
  } catch {
    return names?.[key] || key
  }
}

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'Washington, D.C.', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico',
}

export const ACTIVE_WINDOW_MS = 2 * 60 * 1000

export async function fetchLiveActivity(): Promise<LiveActivity | null> {
  const { data, error } = await supabase.rpc('live_activity')
  if (error || !data) return null
  return data as LiveActivity
}

export async function fetchAdminLiveActivity(): Promise<AdminLiveActivity | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  const res = await fetch('/api/admin/live', { headers: { Authorization: `Bearer ${session.access_token}` } }).catch(() => null)
  if (!res?.ok) return null
  return (await res.json().catch(() => null)) as AdminLiveActivity | null
}

export function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 90) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}
