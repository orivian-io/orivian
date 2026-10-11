'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LevelBadge from '@/components/LevelBadge'
import LiveGlance from '@/components/LiveGlance'
import CourseMenu from '@/components/CourseMenu'
import RemoveCourseDialog from '@/components/RemoveCourseDialog'
import ResetProgressDialog from '@/components/ResetProgressDialog'
import { loadHome, type HomeCourse, type HomeData } from '@/lib/home'
import { fetchMyStats, percent, todayIn, type MyStats } from '@/lib/stats'

type CourseAction = (c: HomeCourse, action: 'reset' | 'remove') => void

const lessonHref = (c: HomeCourse) => (c.next ? `/learn/${c.slug}/${c.next.id}` : `/courses/${c.slug}`)

function pct(c: HomeCourse) {
  return c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
}

function lessonMeta(c: HomeCourse) {
  if (!c.next) return null
  const parts = [`about ${Math.max(1, c.next.minutes)} min`]
  if (c.next.questions > 0) parts.push(`${c.next.questions} questions`)
  return parts.join(', ')
}

function greetingFor(hour: number) {
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function streakLine(stats: MyStats | null) {
  if (!stats) return ''
  const { current, studied_today } = stats.streak
  if (studied_today) {
    return current > 1 ? `You've studied today. That's ${current} days in a row.` : "You've studied today. Come back tomorrow to start a streak."
  }
  if (current > 0) return `Your ${current}-day streak is still open. One lesson today keeps it going.`
  return 'Finish one lesson today to start a streak.'
}

// The last 7 days in the learner's timezone, oldest first.
function lastSevenDays(stats: MyStats) {
  const today = todayIn(stats.timezone)
  const studied = new Map(stats.days.map((d) => [d.day, d.lessons > 0 || d.xp > 0]))
  const base = new Date(`${today}T12:00:00Z`)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    return {
      key,
      letter: d.toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' }),
      label: d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
      studied: studied.get(key) ?? false,
      today: key === today,
    }
  })
}

// Weakest domain with enough answers to mean something.
function focusArea(stats: MyStats | null) {
  if (!stats) return null
  let best: { course: string; slug: string; section: string; accuracy: number; answered: number } | null = null
  for (const c of stats.courses) {
    for (const s of c.sections) {
      if (s.answered < 8) continue
      const accuracy = Math.round((s.correct / s.answered) * 100)
      if (accuracy >= 75) continue
      if (!best || accuracy < best.accuracy) best = { course: c.title, slug: c.slug, section: s.title, accuracy, answered: s.answered }
    }
  }
  return best
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-brand-muted/20"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.max(value, value > 0 ? 2 : 0)}%` }} />
    </div>
  )
}

function UpNext({ course, onAction }: { course: HomeCourse; onAction: CourseAction }) {
  const done = !course.next
  return (
    <section className="relative flex flex-col rounded-2xl border border-brand-primary/30 bg-gradient-to-br from-brand-surface-raised to-brand-surface p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-brand-primary">
          {done ? 'Course complete' : course.next?.started ? 'Pick up where you left off' : 'Up next'}
        </p>
        <div className="-mr-2 -mt-2">
          <CourseMenu
            slug={course.slug}
            title={course.title}
            onReset={() => onAction(course, 'reset')}
            onRemove={() => onAction(course, 'remove')}
          />
        </div>
      </div>
      <p className="mt-1 text-sm text-brand-secondary">
        {course.title}
        {course.next?.section ? `, ${course.next.section}` : ''}
      </p>
      <h2 className="mt-4 max-w-[28ch] text-2xl font-medium leading-snug sm:text-3xl">
        {done ? `You've finished every lesson in ${course.title}.` : course.next?.title}
      </h2>
      {!done && <p className="mt-2 text-sm text-brand-secondary">{lessonMeta(course)}</p>}

      <div className="mt-auto flex flex-col gap-5 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <Link
          href={lessonHref(course)}
          className="inline-flex justify-center rounded-md bg-brand-primary px-7 py-3 font-medium text-black transition hover:bg-brand-primary-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          {done ? 'Review the course' : course.next?.started ? 'Continue lesson' : 'Start lesson'}
        </Link>
        <div className="w-full sm:w-56">
          <p className="mb-1.5 text-right text-xs text-brand-secondary tabular-nums">
            {course.completed} of {course.total} lessons
          </p>
          <ProgressBar value={pct(course)} label={`${course.title} progress`} />
        </div>
      </div>
    </section>
  )
}

function Momentum({ stats }: { stats: MyStats }) {
  const week = lastSevenDays(stats)
  const accuracy = percent(stats.accuracy.week)
  return (
    <section className="rounded-2xl bg-brand-surface p-6">
      <LevelBadge xp={stats.xp.total} variant="card" />

      <div className="mt-6">
        <p className="mb-2 text-sm text-brand-secondary">
          {stats.streak.current > 0 ? `${stats.streak.current}-day streak` : 'This week'}
        </p>
        <ol className="grid grid-cols-7 gap-1.5">
          {week.map((d) => (
            <li key={d.key} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-full items-center justify-center rounded-md text-xs ${
                  d.studied ? 'bg-brand-primary text-black' : 'bg-brand-muted/15 text-brand-muted'
                } ${d.today ? 'ring-1 ring-brand-primary ring-offset-2 ring-offset-brand-surface' : ''}`}
                title={`${d.label}: ${d.studied ? 'studied' : 'no study'}`}
              >
                {d.studied ? '✓' : ''}
              </span>
              <span className={`text-[11px] ${d.today ? 'text-brand-text' : 'text-brand-muted'}`}>{d.letter}</span>
            </li>
          ))}
        </ol>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-brand-muted/15 pt-5">
        <div>
          <dt className="text-xs text-brand-secondary">XP this week</dt>
          <dd className="mt-0.5 text-xl tabular-nums">{stats.xp.week.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs text-brand-secondary">Accuracy this week</dt>
          <dd className="mt-0.5 text-xl tabular-nums">{accuracy === null ? 'None yet' : `${accuracy}%`}</dd>
        </div>
      </dl>
      <Link href="/stats" className="mt-5 inline-block text-sm text-brand-secondary hover:text-brand-primary">
        All your stats
      </Link>
    </section>
  )
}

function CourseList({ courses, onAction }: { courses: HomeCourse[]; onAction: CourseAction }) {
  return (
    <ul className="divide-y divide-brand-muted/15 rounded-xl bg-brand-surface">
      {courses.map((c) => (
        <li key={c.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div className="col-start-1 row-start-1 min-w-0">
            <Link href={`/courses/${c.slug}`} className="font-display text-lg hover:text-brand-primary">
              {c.title}
            </Link>
            <p className="mt-0.5 truncate text-sm text-brand-secondary">
              {c.next ? `Next: ${c.next.title}` : 'All lessons complete'}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={pct(c)} label={`${c.title} progress`} />
              </div>
              <span className="w-24 text-right text-xs text-brand-muted tabular-nums">
                {c.completed} of {c.total}
              </span>
            </div>
          </div>
          <Link
            href={lessonHref(c)}
            className="col-start-1 row-start-2 w-24 justify-self-start sm:col-start-2 sm:row-start-1 rounded-md border border-brand-muted/40 py-2 text-center text-sm transition hover:border-brand-primary hover:text-brand-primary sm:justify-self-end"
          >
            {!c.next ? 'Review' : c.completed === 0 && !c.next.started ? 'Start' : 'Resume'}
          </Link>
          <div className="col-start-2 row-start-1 self-start sm:col-start-3 sm:self-center">
            <CourseMenu
              slug={c.slug}
              title={c.title}
              onReset={() => onAction(c, 'reset')}
              onRemove={() => onAction(c, 'remove')}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function DashboardPage() {
  const [home, setHome] = useState<HomeData | null>(null)
  const [stats, setStats] = useState<MyStats | null>(null)
  const [greeting, setGreeting] = useState('Welcome back')
  const [firstName, setFirstName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [target, setTarget] = useState<{ course: HomeCourse; action: 'reset' | 'remove' } | null>(null)
  const router = useRouter()

  const onAction: CourseAction = (course, action) => setTarget({ course, action })
  const refresh = () => {
    setTarget(null)
    if (userId) loadHome(userId).then(setHome)
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setFirstName((user.user_metadata?.full_name || '').split(' ')[0])
      setGreeting(greetingFor(new Date().getHours()))
      const [h, s] = await Promise.all([loadHome(user.id), fetchMyStats()])
      if (cancelled) return
      setHome(h)
      setStats(s)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [router])

  if (!home) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 text-center text-sm text-brand-secondary">Loading your home…</main>
    )
  }

  const [current, ...others] = home.enrolled
  const focus = focusArea(stats)

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
      <RemoveCourseDialog
        course={target?.action === 'remove' ? { id: target.course.id, title: target.course.title } : null}
        onClose={() => setTarget(null)}
        onDone={refresh}
      />
      {target?.action === 'reset' && (
        <ResetProgressDialog
          open
          scope="course"
          targetId={target.course.id}
          targetTitle={target.course.title}
          onClose={() => setTarget(null)}
          onDone={refresh}
        />
      )}
      <header className="mb-8">
        <h1 className="text-3xl font-medium sm:text-4xl">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-2 text-brand-secondary">
          {current ? streakLine(stats) : 'Pick a course to start. Your progress, notes and streak save automatically.'}
        </p>
      </header>

      {current ? (
        <div className="grid gap-5 lg:grid-cols-[1.75fr_1fr]">
          <UpNext course={current} onAction={onAction} />
          {stats && <Momentum stats={stats} />}
        </div>
      ) : (
        <section>
          <h2 className="mb-4 text-xl font-medium">Choose your first course</h2>
          <ul className="divide-y divide-brand-muted/15 rounded-xl bg-brand-surface">
            {home.explore.map((c) => (
              <li key={c.slug}>
                <Link href={`/courses/${c.slug}`} className="block p-5 hover:bg-brand-surface-raised">
                  <span className="font-display text-lg">{c.title}</span>
                  <span className="mt-1 block text-sm text-brand-secondary line-clamp-2">{c.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.75fr_1fr]">
        <div className="min-w-0 space-y-10">
          {others.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-medium">Your other courses</h2>
              <CourseList courses={others} onAction={onAction} />
            </section>
          )}

          {current && home.explore.length > 0 && (
            <section>
              <h2 className="mb-1 text-xl font-medium">More to study</h2>
              <p className="mb-4 text-sm text-brand-secondary">Free like everything else here.</p>
              <ul className="flex flex-wrap gap-2">
                {home.explore.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/courses/${c.slug}`}
                      className="inline-block rounded-full border border-brand-muted/30 px-4 py-2 text-sm text-brand-secondary transition hover:border-brand-primary hover:text-brand-primary"
                      title={c.description}
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          {focus && (
            <section className="rounded-xl border border-brand-muted/20 p-5">
              <h2 className="font-medium">Worth a second look</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-secondary">
                You&apos;re at <span className="text-brand-text">{focus.accuracy}%</span> on{' '}
                <span className="text-brand-text">{focus.section}</span> across {focus.answered} questions in{' '}
                {focus.course}.
              </p>
              <Link
                href={`/courses/${focus.slug}`}
                className="mt-3 inline-block text-sm text-brand-primary hover:underline"
              >
                Review this domain
              </Link>
            </section>
          )}
          <LiveGlance />
        </aside>
      </div>
    </main>
  )
}
