'use client'

// Learner stats, streaks and leaderboards (see 0010_stats_streaks_leaderboards.sql).

import { supabase } from '@/lib/supabase'

export type Tally = { answered: number; correct: number }

export type DayActivity = { day: string; lessons: number; xp: number }

export type SectionStat = { section_id: string; title: string; answered: number; correct: number }

export type CourseStat = {
  course_id: string
  title: string
  slug: string
  answered: number
  correct: number
  sections: SectionStat[]
}

export type MyStats = {
  timezone: string
  accuracy: { all: Tally; week: Tally; day: Tally }
  daily: { day: string; answered: number; correct: number }[]
  courses: CourseStat[]
  streak: { current: number; longest: number; studied_today: boolean }
  days: DayActivity[]
  xp: { total: number; week: number; day: number }
  lessons_completed: number
}

export type LeaderboardEntry = { name: string; is_you: boolean; current?: number; longest?: number; xp?: number; total_xp?: number }

export type Leaderboard = {
  streaks: LeaderboardEntry[]
  top_day: LeaderboardEntry[]
  top_week: LeaderboardEntry[]
}

// Tell the streak flame / level badge that progress just changed (lesson
// completed, exam submitted) so they refresh and can celebrate a level-up.
export function notifyProgress() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('orivian:progress'))
}

export async function fetchMyStats(): Promise<MyStats | null> {
  const { data, error } = await supabase.rpc('my_stats')
  if (error || !data) return null
  return data as MyStats
}

export async function fetchLeaderboard(): Promise<Leaderboard | null> {
  const { data, error } = await supabase.rpc('leaderboard')
  if (error || !data) return null
  return data as Leaderboard
}

// Keeps the learner's timezone on their profile current, so streak days
// match their own calendar. Runs at most once per browser session.
export async function syncTimezone(userId: string) {
  try {
    if (sessionStorage.getItem('orivian.tz-synced') === userId) return
  } catch {
    // storage blocked - just sync
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (!tz) return
  const { error } = await supabase.from('profiles').update({ timezone: tz }).eq('id', userId)
  if (!error) {
    try {
      sessionStorage.setItem('orivian.tz-synced', userId)
    } catch {
      // ignore
    }
  }
}

export function percent(t: Tally | { answered: number; correct: number }): number | null {
  return t.answered > 0 ? Math.round((t.correct / t.answered) * 100) : null
}

// "YYYY-MM-DD" for today in the given timezone.
export function todayIn(timezone: string): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone })
  } catch {
    return new Date().toLocaleDateString('en-CA')
  }
}

// Streak milestones. Each unlocks a badge; the highest reached is shown
// next to the learner's name on leaderboards.
export const STREAK_TIERS = [
  { days: 3, emoji: '🔥', name: 'Warming Up' },
  { days: 7, emoji: '⚡', name: 'One Week Strong' },
  { days: 14, emoji: '🌟', name: 'Two-Week Star' },
  { days: 30, emoji: '🏆', name: 'Monthly Master' },
  { days: 60, emoji: '💎', name: 'Diamond Discipline' },
  { days: 100, emoji: '👑', name: 'Centurion' },
  { days: 365, emoji: '🚀', name: 'Orivian Legend' },
] as const

export function tierFor(days: number) {
  let tier: (typeof STREAK_TIERS)[number] | null = null
  for (const t of STREAK_TIERS) if (days >= t.days) tier = t
  return tier
}

export function nextTier(days: number) {
  return STREAK_TIERS.find((t) => t.days > days) ?? null
}
