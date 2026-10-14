// Exam accolades + badges. Shared by the grading routes (to work out which
// badges an attempt just unlocked) and the UI (results screen, stats page).
// Accolades are recorded server-side in accolade_events (see migration
// 0029); badges are just thresholds over those counts, so they can be
// added or re-tiered here without touching the database.

export type AccoladeKind =
  | 'perfect'
  | 'first_try_perfect'
  | 'daily_perfect'
  | 'checkpoint_perfect'
  | 'comeback'
  | 'final_pass'
  | 'final_excellent'

export const ACCOLADES: Record<AccoladeKind, { title: string; detail: string }> = {
  perfect: { title: 'Perfect score', detail: 'Every question right.' },
  daily_perfect: { title: "Today's True North", detail: 'Your first perfect score of the day.' },
  first_try_perfect: { title: 'First-try flawless', detail: 'Aced on your very first attempt.' },
  checkpoint_perfect: { title: 'Domain cleared', detail: 'A perfect domain checkpoint.' },
  comeback: { title: 'Second wind', detail: 'Passed right after a missed attempt.' },
  final_pass: { title: 'Summit reached', detail: 'Passing-equivalent score on a full practice exam.' },
  final_excellent: { title: 'Above the clouds', detail: '90% or higher on a full practice exam.' },
}

export type BadgeGlyph = 'compass' | 'trail' | 'map' | 'sun' | 'star' | 'ridge' | 'wind' | 'flag' | 'cloud'

export type BadgeDef = {
  key: string
  name: string
  description: string
  kind: AccoladeKind
  threshold: number
  glyph: BadgeGlyph
}

export const BADGES: BadgeDef[] = [
  { key: 'true-north', name: 'True North', description: 'Earn your first perfect score', kind: 'perfect', threshold: 1, glyph: 'compass' },
  { key: 'trailblazer', name: 'Trailblazer', description: 'Perfect scores on 5 different exams', kind: 'perfect', threshold: 5, glyph: 'trail' },
  { key: 'pathfinder', name: 'Pathfinder', description: 'Perfect scores on 25 different exams', kind: 'perfect', threshold: 25, glyph: 'star' },
  { key: 'cartographer', name: 'Cartographer', description: 'Perfect scores on 100 different exams', kind: 'perfect', threshold: 100, glyph: 'map' },
  { key: 'clear-skies', name: 'Clear Skies', description: "Earn Today's True North on 7 different days", kind: 'daily_perfect', threshold: 7, glyph: 'sun' },
  { key: 'dead-reckoning', name: 'Dead Reckoning', description: 'Ace 10 exams on the first try', kind: 'first_try_perfect', threshold: 10, glyph: 'compass' },
  { key: 'ridgeline', name: 'Ridgeline', description: 'Score 100% on a domain checkpoint', kind: 'checkpoint_perfect', threshold: 1, glyph: 'ridge' },
  { key: 'second-wind', name: 'Second Wind', description: 'Pass an exam right after missing it', kind: 'comeback', threshold: 1, glyph: 'wind' },
  { key: 'summit', name: 'Summit', description: 'Pass a full-length practice exam', kind: 'final_pass', threshold: 1, glyph: 'flag' },
  { key: 'above-the-clouds', name: 'Above the Clouds', description: 'Score 90%+ on a full-length practice exam', kind: 'final_excellent', threshold: 1, glyph: 'cloud' },
]

export type AccoladeCounts = Partial<Record<AccoladeKind, number>>

export function badgeByKey(key: string) {
  return BADGES.find((b) => b.key === key)
}

// Badges whose threshold was crossed between two count snapshots.
export function newlyEarnedBadges(before: AccoladeCounts, after: AccoladeCounts): string[] {
  return BADGES
    .filter((b) => (before[b.kind] ?? 0) < b.threshold && (after[b.kind] ?? 0) >= b.threshold)
    .map((b) => b.key)
}

// What the grading routes add to their JSON response.
export type AttemptAccolades = {
  perfect: boolean
  repeatPerfect: boolean
  accolades: AccoladeKind[]
  newBadges: string[]
}

export const NO_ACCOLADES: AttemptAccolades = { perfect: false, repeatPerfect: false, accolades: [], newBadges: [] }

export type AccoladeEvent = { kind: AccoladeKind; created_at: string; local_day: string }

export type BadgeStatus = BadgeDef & { count: number; earned: boolean; earnedAt: string | null }

// Badge shelf state from the learner's accolade history (oldest first or
// any order - sorted here).
export function badgeStatuses(events: AccoladeEvent[]): BadgeStatus[] {
  const byKind = new Map<AccoladeKind, string[]>()
  for (const e of [...events].sort((x, y) => x.created_at.localeCompare(y.created_at))) {
    const list = byKind.get(e.kind) ?? []
    list.push(e.created_at)
    byKind.set(e.kind, list)
  }
  return BADGES.map((b) => {
    const times = byKind.get(b.kind) ?? []
    const earned = times.length >= b.threshold
    return { ...b, count: times.length, earned, earnedAt: earned ? times[b.threshold - 1] : null }
  })
}
