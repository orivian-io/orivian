// Learner levels, derived from all-time XP. Each level takes a little more
// XP than the last: reaching level n takes 50 * n * (n - 1) XP in total
// (level 2 = 100 XP, level 5 = 1,000, level 10 = 4,500, level 20 = 19,000).

export const LEVEL_TITLES = [
  { from: 1, emoji: '🌱', title: 'Newcomer' },
  { from: 5, emoji: '🧭', title: 'Explorer' },
  { from: 10, emoji: '🥾', title: 'Pathfinder' },
  { from: 15, emoji: '🗺️', title: 'Navigator' },
  { from: 20, emoji: '⛰️', title: 'Trailblazer' },
  { from: 30, emoji: '🏔️', title: 'Wayfinder' },
] as const

export function xpForLevel(level: number) {
  return 50 * level * (level - 1)
}

export type LevelInfo = {
  level: number
  title: string
  emoji: string
  xp: number
  levelStartXp: number
  nextLevelXp: number
  progress: number // 0-1 through the current level
}

export function levelFor(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp || 0))
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.08 * xp)) / 2))
  // Guard against floating-point edge cases right at a threshold.
  while (xpForLevel(level + 1) <= xp) level++
  while (level > 1 && xpForLevel(level) > xp) level--

  let named: (typeof LEVEL_TITLES)[number] = LEVEL_TITLES[0]
  for (const t of LEVEL_TITLES) if (level >= t.from) named = t

  const levelStartXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  return {
    level,
    title: named.title,
    emoji: named.emoji,
    xp,
    levelStartXp,
    nextLevelXp,
    progress: (xp - levelStartXp) / (nextLevelXp - levelStartXp),
  }
}
