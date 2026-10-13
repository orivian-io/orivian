'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import StreakCalendar from '@/components/StreakCalendar'
import AccuracyTrend from '@/components/AccuracyTrend'
import StudyTimeChart from '@/components/StudyTimeChart'
import { fetchStudyTime, formatStudyTime, type StudyTime } from '@/lib/study-time'
import LevelBadge from '@/components/LevelBadge'
import Avatar from '@/components/Avatar'
import { nextAvatarUnlock } from '@/lib/avatars'
import { levelFor } from '@/lib/levels'
import {
  STREAK_TIERS,
  fetchLeaderboard,
  fetchMyStats,
  nextTier,
  percent,
  syncTimezone,
  tierFor,
  todayIn,
  type CourseStat,
  type Leaderboard,
  type LeaderboardEntry,
  type MyStats,
  type Tally,
} from '@/lib/stats'
import { BearingIcon, FlameIcon, SummitIcon } from '@/components/Icons'

const MIN_ANSWERS_FOR_INSIGHT = 5
const MEDALS = ['🥇', '🥈', '🥉']

export default function StatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<MyStats | null>(null)
  const [board, setBoard] = useState<Leaderboard | null>(null)
  const [studyTime, setStudyTime] = useState<StudyTime | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'streaks' | 'day' | 'week'>('streaks')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      await syncTimezone(user.id).catch(() => {})
      const [s, b] = await Promise.all([fetchMyStats(), fetchLeaderboard()])
      setStats(s)
      setBoard(b)
      setLoading(false)
      if (s) {
        fetchStudyTime(user.id, s.timezone, todayIn(s.timezone))
          .then(setStudyTime)
          .catch(() => setStudyTime(null))
      }
    }
    load()
  }, [router])

  if (loading) {
    return <main className="max-w-5xl mx-auto py-24 px-6 text-center text-sm text-brand-secondary">Loading your stats…</main>
  }

  if (!stats) {
    return (
      <main className="max-w-5xl mx-auto py-24 px-6 text-center text-sm text-brand-secondary">
        Stats aren&apos;t available right now. Please try again shortly.
      </main>
    )
  }

  const today = todayIn(stats.timezone)
  const { current, longest, studied_today } = stats.streak
  const tier = tierFor(current)
  const next = nextTier(current)

  return (
    <main className="max-w-5xl mx-auto w-full py-14 px-6">
      <h1 className="text-4xl font-medium mb-2">Your stats</h1>
      <p className="text-brand-secondary text-sm mb-10">
        {studied_today
          ? `Nice work today. ${next ? `${next.days - current} more day${next.days - current === 1 ? '' : 's'} to unlock ${next.emoji} ${next.name}.` : 'Every streak badge unlocked.'}`
          : current > 0
            ? `Complete a lesson today to keep your ${current}-day streak going.`
            : 'Complete a lesson to start a streak.'}
      </p>

      {/* Level */}
      <div className="rounded-xl bg-brand-surface p-5 mb-3">
        <LevelBadge xp={stats.xp.total} variant="card" />
        <NextUnlock level={levelFor(stats.xp.total).level} />
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        <Tile big={<><FlameIcon className="inline h-7 w-7 -mt-1 mr-1.5" />{current}</>} label="Current streak" sub={`${current === 1 ? 'day' : 'days'}${tier ? ` · ${tier.name}` : ''}`} highlight={studied_today} />
        <Tile big={String(longest)} label="Longest streak" sub={longest === 1 ? 'day' : 'days'} />
        <Tile big={stats.xp.week.toLocaleString()} label="XP this week" sub={`${stats.xp.total.toLocaleString()} all-time`} />
        <Tile big={String(stats.lessons_completed)} label="Lessons completed" sub="all courses" />
      </div>

      {/* Study time */}
      {studyTime && <StudyTimeSection time={studyTime} today={today} />}

      {/* Accuracy */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-1">Answer accuracy</h2>
        <p className="text-sm text-brand-secondary mb-4">Every question you&apos;ve answered on mini-exams, checkpoints and practice exams.</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <AccuracyTile label="All time" tally={stats.accuracy.all} />
          <AccuracyTile label="Last 7 days" tally={stats.accuracy.week} />
          <AccuracyTile label="Last 24 hours" tally={stats.accuracy.day} />
        </div>
        {stats.daily.length > 0 ? (
          <div className="rounded-xl bg-brand-surface p-5">
            <p className="text-sm text-brand-secondary mb-4">Daily accuracy · last 30 days</p>
            <AccuracyTrend daily={stats.daily} today={today} />
          </div>
        ) : (
          <EmptyNote>Take a mini-exam to start tracking your accuracy over time.</EmptyNote>
        )}
      </section>

      {/* Per course */}
      {stats.courses.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-medium mb-4">Strengths &amp; focus areas</h2>
          <div className="space-y-4">
            {stats.courses.map((c) => (
              <CourseCard key={c.course_id} course={c} />
            ))}
          </div>
        </section>
      )}

      {/* Activity + badges */}
      <section className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div>
          <h2 className="text-xl font-medium mb-4">Activity</h2>
          <div className="rounded-xl bg-brand-surface p-5">
            <StreakCalendar days={stats.days} today={today} />
          </div>
          <p className="mt-2 text-xs text-brand-muted">A day counts toward your streak when you complete at least one lesson.</p>
        </div>
        <div>
          <h2 className="text-xl font-medium mb-4">Streak badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STREAK_TIERS.map((t) => {
              const earned = longest >= t.days
              return (
                <div
                  key={t.days}
                  className={`rounded-xl p-4 text-center border ${
                    earned ? 'border-brand-primary/40 bg-brand-primary/10' : 'border-brand-muted/15 bg-brand-surface'
                  }`}
                  title={earned ? `Unlocked: ${t.days}-day streak` : `Reach a ${t.days}-day streak to unlock`}
                >
                  <p className={`text-3xl mb-1 ${earned ? '' : 'grayscale opacity-30'}`}>{t.emoji}</p>
                  <p className={`text-sm ${earned ? 'text-brand-text' : 'text-brand-muted'}`}>{t.name}</p>
                  <p className="text-xs text-brand-secondary">{t.days}-day streak</p>
                  {!earned && longest > 0 && (
                    <div className="mt-2 h-1 rounded-full bg-brand-muted/20 overflow-hidden">
                      <div className="h-full bg-brand-primary/60" style={{ width: `${Math.min(100, (longest / t.days) * 100)}%` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Leaderboards */}
      <section className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <h2 className="text-xl font-medium">Leaderboards</h2>
          <div className="flex gap-1 rounded-lg bg-brand-surface p-1 text-sm" role="tablist">
            {[
              ['streaks', 'Streaks'],
              ['day', 'Top today'],
              ['week', 'Top this week'],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id as typeof tab)}
                className={`rounded-md px-3 py-1.5 transition ${tab === id ? 'bg-brand-primary text-black font-medium' : 'text-brand-secondary hover:text-brand-text'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {board ? (
          <LeaderboardList
            entries={tab === 'streaks' ? board.streaks : tab === 'day' ? board.top_day : board.top_week}
            mode={tab === 'streaks' ? 'streak' : 'xp'}
          />
        ) : (
          <EmptyNote>Leaderboards aren&apos;t available right now.</EmptyNote>
        )}
        <p className="mt-3 text-xs text-brand-muted">
          &quot;Top&quot; boards rank XP over the last 24 hours and 7 days. Everyone appears by their public alias, never their
          real name. Change your alias or hide yourself from leaderboards on your{' '}
          <Link href="/profile" className="text-brand-primary hover:underline">
            profile
          </Link>
          .
        </p>
      </section>

      <details className="rounded-xl bg-brand-surface p-5 text-sm">
        <summary className="cursor-pointer text-brand-secondary">How XP and levels work</summary>
        <ul className="mt-3 space-y-1 text-brand-text/85">
          <li>• 50 XP for completing a lesson the first time (20 XP for recaps and orientation lessons)</li>
          <li>• 1 XP per correct answer (your first 3 attempts at an exam each day)</li>
          <li>• 100 XP the first time you pass a domain checkpoint</li>
          <li>• 150 XP the first time you pass a practice exam</li>
        </ul>
        <p className="mt-3 text-brand-secondary">
          Levels come from your all-time XP, and each one takes a little more than the last: 🌱 Newcomer (1-4), 🧭 Explorer
          (5-9), 🥾 Pathfinder (10-14), 🗺️ Navigator (15-19), ⛰️ Trailblazer (20-29), 🏔️ Wayfinder (30+).
        </p>
      </details>
    </main>
  )
}

function StudyTimeSection({ time, today }: { time: StudyTime; today: string }) {
  const weekDelta = time.thisWeek - time.lastWeek
  const maxCourse = Math.max(1, ...time.courses.map((c) => c.seconds))
  return (
    <section className="mb-12">
      <h2 className="text-xl font-medium mb-1">Study time</h2>
      <p className="text-sm text-brand-secondary mb-4">Time spent in lessons and exams, from the same timer you see while studying.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <TimeTile label="Today" value={formatStudyTime(time.today)} />
        <TimeTile
          label="This week"
          value={formatStudyTime(time.thisWeek)}
          sub={
            time.lastWeek === 0 && time.thisWeek === 0
              ? 'Mon – Sun'
              : `${weekDelta >= 0 ? '▲' : '▼'} ${formatStudyTime(Math.abs(weekDelta))} vs last week`
          }
          subTone={time.lastWeek === 0 && time.thisWeek === 0 ? undefined : weekDelta >= 0 ? 'up' : 'down'}
        />
        <TimeTile label="Daily average" value={formatStudyTime(time.last7Avg)} sub="last 7 days" />
        <TimeTile label="All time" value={formatStudyTime(time.allTime)} sub={`${time.activeDays30} active day${time.activeDays30 === 1 ? '' : 's'} in the last 30`} />
      </div>
      {time.allTime > 0 ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,18rem)]">
          <div className="rounded-xl bg-brand-surface p-5">
            <StudyTimeChart days={time.days} weeks={time.weeks} today={today} />
          </div>
          {time.courses.length > 0 && (
            <div className="rounded-xl bg-brand-surface p-5">
              <p className="text-sm text-brand-secondary mb-4">By course · all time</p>
              <ul className="space-y-3">
                {time.courses.map((c) => (
                  <li key={c.courseId}>
                    <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
                      {c.slug ? (
                        <Link href={`/courses/${c.slug}`} className="truncate text-brand-text hover:text-brand-primary transition">
                          {c.title}
                        </Link>
                      ) : (
                        <span className="truncate text-brand-text">{c.title}</span>
                      )}
                      <span className="shrink-0 tabular-nums text-brand-secondary">{formatStudyTime(c.seconds)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-brand-muted/20 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-primary" style={{ width: `${(c.seconds / maxCourse) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <EmptyNote>Open a lesson to start tracking your study time.</EmptyNote>
      )}
    </section>
  )
}

function TimeTile({ label, value, sub, subTone }: { label: string; value: string; sub?: string; subTone?: 'up' | 'down' }) {
  return (
    <div className="rounded-xl bg-brand-surface p-4 sm:p-5">
      <p className="text-xs text-brand-secondary mb-1">{label}</p>
      <p className="font-display text-3xl sm:text-4xl tabular-nums">{value}</p>
      {sub && (
        <p className={`text-xs tabular-nums ${subTone === 'up' ? 'text-brand-primary' : 'text-brand-secondary'}`}>{sub}</p>
      )}
    </div>
  )
}

function NextUnlock({ level }: { level: number }) {
  const next = nextAvatarUnlock(level)
  if (!next) return <p className="mt-4 text-xs text-brand-secondary">Every avatar unlocked.</p>
  return (
    <Link
      href="/profile?avatars=1"
      className="mt-4 flex items-center gap-3 rounded-lg border border-brand-muted/15 px-3 py-2 text-sm hover:border-brand-primary/40 transition"
    >
      <span className="opacity-50 grayscale">
        <Avatar avatarId={next.id} size={32} />
      </span>
      <span className="text-brand-secondary">
        Next avatar: <span className="text-brand-text">{next.name}</span> unlocks at Level {next.unlockLevel}
      </span>
      <span className="ml-auto text-brand-primary">Avatars</span>
    </Link>
  )
}

function Tile({ big, label, sub, highlight }: { big: React.ReactNode; label: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${highlight ? 'bg-brand-primary/10 border border-brand-primary/40' : 'bg-brand-surface'}`}>
      <p className="font-display text-4xl text-brand-primary tabular-nums">{big}</p>
      <p className="text-sm text-brand-text mt-1">{label}</p>
      {sub && <p className="text-xs text-brand-secondary">{sub}</p>}
    </div>
  )
}

function AccuracyTile({ label, tally }: { label: string; tally: Tally }) {
  const pct = percent(tally)
  return (
    <div className="rounded-xl bg-brand-surface p-4 sm:p-5">
      <p className="text-xs text-brand-secondary mb-1">{label}</p>
      <p className="font-display text-3xl sm:text-4xl tabular-nums">{pct === null ? '-' : `${pct}%`}</p>
      <p className="text-xs text-brand-secondary tabular-nums">
        {tally.answered > 0 ? `${tally.correct} of ${tally.answered} correct` : 'No answers yet'}
      </p>
    </div>
  )
}

function CourseCard({ course }: { course: CourseStat }) {
  const pct = percent(course) ?? 0
  const rated = course.sections
    .filter((s) => s.answered >= MIN_ANSWERS_FOR_INSIGHT)
    .map((s) => ({ ...s, pct: Math.round((s.correct / s.answered) * 100) }))
  const strengths = [...rated].filter((s) => s.pct >= 80).sort((a, b) => b.pct - a.pct).slice(0, 3)
  const focus = [...rated].filter((s) => s.pct < 80).sort((a, b) => a.pct - b.pct).slice(0, 3)

  return (
    <div className="rounded-xl bg-brand-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <Link href={`/courses/${course.slug}`} className="font-medium hover:text-brand-primary transition">
          {course.title}
        </Link>
        <span className="text-sm text-brand-secondary tabular-nums">
          <span className="text-brand-text font-medium">{pct}%</span> · {course.correct} of {course.answered} correct
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-brand-muted/20 overflow-hidden mb-4">
        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${pct}%` }} />
      </div>

      {rated.length === 0 ? (
        <p className="text-sm text-brand-secondary">
          Answer at least {MIN_ANSWERS_FOR_INSIGHT} questions in a domain to see your strengths and focus areas.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <InsightList
            title="Strengths"
            icon={<SummitIcon className="h-4 w-4 text-brand-success" />}
            empty="No domain at 80%+ yet - keep going."
            items={strengths}
          />
          <InsightList title="Focus areas" icon={<BearingIcon className="h-4 w-4 text-brand-primary" />} empty="Nothing below 80%. Great work." items={focus} />
        </div>
      )}
    </div>
  )
}

function InsightList({ title, icon, empty, items }: { title: string; icon?: React.ReactNode; empty: string; items: { section_id: string; title: string; pct: number; correct: number; answered: number }[] }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm text-brand-secondary mb-2">
        {icon}
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-brand-muted">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((s) => (
            <li key={s.section_id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-brand-text">{s.title}</span>
              <span className="shrink-0 tabular-nums text-brand-secondary">
                <span className="text-brand-text">{s.pct}%</span> ({s.correct}/{s.answered})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LeaderboardList({ entries, mode }: { entries: LeaderboardEntry[]; mode: 'streak' | 'xp' }) {
  if (entries.length === 0) {
    return <EmptyNote>{mode === 'streak' ? 'No streaks yet - complete a lesson to start one.' : 'No activity in this period yet. Be the first!'}</EmptyNote>
  }
  return (
    <ol className="rounded-xl bg-brand-surface divide-y divide-brand-muted/10">
      {entries.map((e, i) => {
        return (
          <li
            key={`${e.name}-${i}`}
            className={`flex items-center gap-3 px-4 py-3 ${e.is_you ? 'bg-brand-primary/10' : ''}`}
          >
            <span className="w-7 text-center tabular-nums text-brand-secondary">{MEDALS[i] ?? i + 1}</span>
            <span className="flex flex-1 min-w-0 items-center gap-2">
              <Avatar avatarId={e.avatar} name={e.name} size={28} />
              <span className="truncate">{e.name}</span>
              {typeof e.total_xp === 'number' && <LevelBadge xp={e.total_xp} />}
              {e.is_you && <span className="text-xs text-brand-primary">You</span>}
            </span>
            {mode === 'streak' ? (
              <span className="text-sm tabular-nums">
                <span className="text-brand-text">
                  <FlameIcon className="inline h-3.5 w-3.5 -mt-0.5 mr-1 text-brand-primary" />{e.current} day{e.current === 1 ? '' : 's'}
                </span>
                <span className="ml-3 text-brand-muted">best {e.longest}</span>
              </span>
            ) : (
              <span className="text-sm tabular-nums text-brand-text">{(e.xp ?? 0).toLocaleString()} XP</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-brand-muted/30 p-6 text-center text-sm text-brand-secondary">{children}</div>
}
