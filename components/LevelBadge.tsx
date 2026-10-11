import { levelFor } from '@/lib/levels'

// Level display. "pill" is a compact chip (leaderboards, menus); "card"
// shows the title and progress toward the next level.
export default function LevelBadge({ xp, variant = 'pill' }: { xp: number; variant?: 'pill' | 'card' }) {
  const info = levelFor(xp)

  if (variant === 'pill') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-brand-muted/30 px-2 py-0.5 text-xs text-brand-secondary tabular-nums whitespace-nowrap"
        title={`Level ${info.level} · ${info.title} (${info.xp.toLocaleString()} XP)`}
      >
        <span aria-hidden="true">{info.emoji}</span>
        Lv {info.level}
      </span>
    )
  }

  const toNext = info.nextLevelXp - info.xp
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brand-primary/50 bg-brand-primary/10 text-2xl"
        aria-hidden="true"
      >
        {info.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-medium">
          Level {info.level} <span className="text-brand-secondary font-normal">· {info.title}</span>
        </p>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-muted/20"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(info.progress * 100)}
          aria-label={`Progress to level ${info.level + 1}`}
        >
          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.max(2, info.progress * 100)}%` }} />
        </div>
        <p className="mt-1 text-xs text-brand-secondary tabular-nums">
          {info.xp.toLocaleString()} XP · {toNext.toLocaleString()} XP to Level {info.level + 1}
        </p>
      </div>
    </div>
  )
}
