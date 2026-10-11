'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ActivityMap from '@/components/ActivityMap'
import { fetchPublicPulse, placeName, timeAgo, type PublicPulse } from '@/lib/live'

type CourseRow = { id: string; slug: string; title: string; description: string; lessons: number }

const PULSE_REFRESH_MS = 60_000

function plural(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`
}

// One plain sentence about who's studying, written for whatever the
// numbers are right now (including none at all).
function PulseSentence({ pulse }: { pulse: PublicPulse }) {
  const { now, week, month, countries } = pulse.totals
  const where = countries > 1 ? ` across ${plural(countries, 'country', 'countries')}` : ''
  const n = (v: number) => <strong className="font-medium text-brand-text tabular-nums">{v.toLocaleString()}</strong>

  if (month === 0) {
    return <>The map is waiting for its first light. Start a lesson and it&apos;s yours.</>
  }
  const recent =
    week > 0 ? (
      <>
        {n(week)} {week === 1 ? 'person' : 'people'} studied this week{where}.
      </>
    ) : (
      <>
        {n(month)} {month === 1 ? 'person' : 'people'} studied this month{where}.
      </>
    )
  if (now > 0) {
    return (
      <>
        {n(now)} {now === 1 ? 'person is' : 'people are'} studying right now. {recent}
      </>
    )
  }
  return recent
}

export default function Home() {
  const [checking, setChecking] = useState(true)
  const [pulse, setPulse] = useState<PublicPulse | null>(null)
  const [courses, setCourses] = useState<CourseRow[]>([])
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [router])

  useEffect(() => {
    if (checking) return
    let cancelled = false
    const load = () => fetchPublicPulse().then((p) => !cancelled && p && setPulse(p))
    load()
    const id = setInterval(() => document.visibilityState === 'visible' && load(), PULSE_REFRESH_MS)

    supabase
      .from('courses')
      .select('id, slug, title, description')
      .eq('published', true)
      .then(async ({ data }) => {
        if (!data) return
        const rows = await Promise.all(
          data.map(async (c) => {
            const { count } = await supabase
              .from('lessons')
              .select('id', { count: 'exact', head: true })
              .eq('course_id', c.id)
            return { ...c, lessons: count || 0 }
          }),
        )
        if (!cancelled) setCourses(rows.sort((a, b) => b.lessons - a.lessons))
      })

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [checking])

  if (checking) return null

  return (
    <main className="overflow-x-clip">
      {/* Hero: the map is the picture. Every glow is someone studying. */}
      <section className="relative">
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-primary/40 px-3 py-1 text-xs text-brand-primary">
            Free and in beta since September 2026
          </p>
          <h1 className="max-w-[15ch] text-[2.6rem] font-medium leading-[1.05] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
            Every light is someone studying.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-secondary">
            Orivian is free certification prep for security and IT professionals. Full courses, practice exams and
            narrated lessons, with no paywall anywhere.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-brand-primary px-7 py-3 font-medium text-black transition hover:bg-brand-primary-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              Start learning free
            </Link>
            <Link
              href="/courses"
              className="rounded-md border border-brand-muted/40 px-7 py-3 font-medium transition hover:border-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              Browse courses
            </Link>
          </div>
        </div>

        <div
          className="relative mx-auto -mt-2 max-w-[1500px] sm:-mt-10 lg:-mt-24"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 80%, transparent 100%)',
          }}
        >
          {/* On phones the map runs wider than the screen so the dots stay readable. */}
          <div className="ml-[-30%] w-[160%] sm:ml-0 sm:w-full">
            <ActivityMap regions={pulse?.map || []} span="month" variant="hero" />
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-4 max-w-6xl px-4 sm:-mt-10 sm:px-6">
          <p className="flex max-w-2xl items-start gap-3 text-base text-brand-secondary sm:text-lg" aria-live="polite">
            <span className="relative mt-2 inline-flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#E4C473] opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#E4C473]" />
            </span>
            <span>{pulse ? <PulseSentence pulse={pulse} /> : 'Loading who’s studying…'}</span>
          </p>
        </div>
      </section>

      {pulse && pulse.feed.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
          <h2 className="mb-4 text-lg font-medium">Lessons just finished</h2>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-x-8 sm:grid-cols-2">
            {pulse.feed.slice(0, 6).map((f, i) => (
              <li key={`${f.at}-${i}`} className="flex items-baseline justify-between gap-4 border-t border-brand-muted/15 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-brand-text">{f.lesson}</span>
                  <span className="block truncate text-sm text-brand-secondary">
                    {f.place ? `${f.course}, finished in ${placeName(f.place)}` : f.course}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-brand-muted tabular-nums">{timeAgo(f.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="text-3xl font-medium leading-tight">What you can study</h2>
            <p className="mt-3 max-w-sm text-brand-secondary">
              Each course follows the official exam outline, with a quiz after every lesson and full practice exams at
              the end.
            </p>
          </div>
          <ul>
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/courses/${c.slug}`}
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-t border-brand-muted/15 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
                >
                  <span className="font-display text-xl transition group-hover:text-brand-primary">{c.title}</span>
                  <span className="text-sm text-brand-muted tabular-nums">{plural(c.lessons, 'lesson')}</span>
                  {c.description && (
                    <span className="col-span-2 line-clamp-1 text-sm text-brand-secondary">{c.description}</span>
                  )}
                </Link>
              </li>
            ))}
            {courses.length === 0 && <li className="h-48 animate-pulse rounded-lg bg-brand-surface/60" />}
          </ul>
        </div>
      </section>

      <section className="border-t border-brand-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="mb-6 text-3xl font-medium">Certifications shouldn&apos;t require a toll booth.</h2>
          <p className="mb-6 text-lg leading-relaxed text-brand-secondary">
            The knowledge behind every major certification already exists, scattered across the internet, largely
            free. What&apos;s missing isn&apos;t the information. It&apos;s a place that organizes it, teaches it
            properly, and doesn&apos;t charge you hundreds of dollars for the privilege.
          </p>
          <p className="text-lg leading-relaxed text-brand-secondary">
            Orivian is that place. It launched in September 2026 as a beta, and new courses are added as they&apos;re
            built out properly. What you&apos;re using today is the beginning, not the finished product.
          </p>
        </div>
      </section>

      <section className="border-t border-brand-muted/20">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-2xl font-medium">Add your light to the map.</h2>
            <p className="mt-1 text-brand-secondary">A free account saves your progress, notes and streak.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 rounded-md bg-brand-primary px-7 py-3 font-medium text-black transition hover:bg-brand-primary-light"
          >
            Create free account
          </Link>
        </div>
      </section>
    </main>
  )
}
