'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Category = { id: string; slug: string; name: string; description: string | null }

type CatalogSection = { title: string; weight: number | null; lessons: number; completed: number }

type CatalogCourse = {
  id: string
  slug: string
  title: string
  description: string
  category_id: string | null
  difficulty: string | null
  provider: string | null
  lessons: number
  minutes: number
  questions: number
  practice_exams: number
  learners: number
  active_week: number
  enrolled: boolean
  completed: number
  last_active: string | null
  sections: CatalogSection[]
}

type Sort = 'popular' | 'az' | 'shortest'

function hours(minutes: number) {
  const h = minutes / 60
  if (h < 1) return `${Math.max(1, Math.round(minutes))} min`
  return `${h < 10 ? Math.round(h * 2) / 2 : Math.round(h)} hours`
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`
}

// The course's domains as one segmented bar, sized by exam weight (or
// lesson count), filled in as the learner completes lessons.
function DomainStrip({ sections, showProgress }: { sections: CatalogSection[]; showProgress: boolean }) {
  if (sections.length === 0) return null
  const useWeight = sections.every((s) => s.weight && s.weight > 0)
  const sizes = sections.map((s) => (useWeight ? Number(s.weight) : s.lessons))
  const total = sizes.reduce((a, b) => a + b, 0) || 1
  return (
    <div className="flex h-2 gap-[3px]" aria-hidden="true">
      {sections.map((s, i) => {
        const done = s.lessons > 0 ? s.completed / s.lessons : 0
        return (
          <span
            key={`${s.title}-${i}`}
            className="relative h-full overflow-hidden rounded-full bg-brand-muted/25"
            style={{ width: `${(sizes[i] / total) * 100}%` }}
            title={`${s.title}${useWeight ? `, ${s.weight}% of the exam` : ''}${showProgress ? `, ${s.completed} of ${s.lessons} lessons done` : `, ${s.lessons} lessons`}`}
          >
            {showProgress && done > 0 && (
              <span className="absolute inset-y-0 left-0 rounded-full bg-brand-primary" style={{ width: `${done * 100}%` }} />
            )}
          </span>
        )
      })}
    </div>
  )
}

function CourseCard({ c }: { c: CatalogCourse }) {
  const pct = c.lessons > 0 ? Math.round((c.completed / c.lessons) * 100) : 0
  const domainWord = c.sections.length > 0 && c.sections.some((s) => /domain/i.test(s.title)) ? 'domain' : 'section'
  return (
    <li>
      <Link
        href={`/courses/${c.slug}`}
        className={`group flex h-full flex-col rounded-xl border p-6 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary ${
          c.enrolled
            ? 'border-brand-primary/30 bg-brand-surface hover:border-brand-primary/60'
            : 'border-transparent bg-brand-surface hover:border-brand-muted/40'
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-brand-secondary">{c.provider || 'Orivian'}</span>
          {c.difficulty && <span className="rounded-full border border-brand-muted/30 px-2 py-0.5 text-brand-secondary">{c.difficulty}</span>}
        </div>
        <h3 className="font-display text-[1.4rem] leading-snug transition group-hover:text-brand-primary">{c.title}</h3>
        {c.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-brand-secondary">{c.description}</p>}

        <div className="mt-5">
          <DomainStrip sections={c.sections} showProgress={c.enrolled} />
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-secondary">
          <li>{plural(c.lessons, 'lesson')}</li>
          {c.sections.length > 0 && <li>{plural(c.sections.length, domainWord)}</li>}
          {c.minutes > 0 && <li>About {hours(c.minutes)}</li>}
          {c.practice_exams > 0 && <li>{plural(c.practice_exams, 'practice exam')}</li>}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <p className="text-xs text-brand-muted">
            {c.learners > 0 ? (
              <>
                {plural(c.learners, 'learner')}
                {c.active_week > 0 && <span className="block text-brand-secondary">{c.active_week} studied this week</span>}
              </>
            ) : (
              'Be one of the first learners'
            )}
          </p>
          <span className={`shrink-0 text-sm ${c.enrolled ? 'text-brand-primary' : 'text-brand-secondary group-hover:text-brand-primary'}`}>
            {c.enrolled ? (pct === 100 ? 'Completed' : `${pct}% complete`) : 'View course'}
          </span>
        </div>
      </Link>
    </li>
  )
}

export default function CoursesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<CatalogCourse[] | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<Sort>('popular')

  const [requestTitle, setRequestTitle] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => setCategories(data || []))
    supabase.rpc('course_catalog').then(async ({ data, error }) => {
      if (!error && data) {
        setCourses(data as CatalogCourse[])
        return
      }
      // Migration 0017 not run yet: fall back to the basic course list.
      const { data: basic } = await supabase.from('courses').select('*').eq('published', true)
      setCourses(
        (basic || []).map((c) => ({
          ...c,
          lessons: 0, minutes: 0, questions: 0, practice_exams: 0, learners: 0, active_week: 0,
          enrolled: false, completed: 0, last_active: null, sections: [],
        })),
      )
    })
  }, [])

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequestError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('course_requests').insert({
      user_id: user?.id || null,
      requested_title: requestTitle,
      notes: requestNotes || null,
    })
    if (error) {
      setRequestError("Couldn't send your request. Try again.")
    } else {
      setRequestSubmitted(true)
      setRequestTitle('')
      setRequestNotes('')
    }
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const list = (courses || []).filter((c) => {
      const inCategory = activeCategory === 'all' || c.category_id === activeCategory
      const matches =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.provider || '').toLowerCase().includes(q) ||
        c.sections.some((s) => s.title.toLowerCase().includes(q))
      return inCategory && matches
    })
    return list.sort((a, b) =>
      sort === 'az'
        ? a.title.localeCompare(b.title)
        : sort === 'shortest'
          ? a.minutes - b.minutes
          : b.learners - a.learners || b.active_week - a.active_week || a.title.localeCompare(b.title),
    )
  }, [courses, activeCategory, searchQuery, sort])

  if (!courses) {
    return <main className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-brand-secondary">Loading courses…</main>
  }

  const mine = courses
    .filter((c) => c.enrolled)
    .sort((a, b) => (b.last_active || '').localeCompare(a.last_active || ''))
  const totalLessons = courses.reduce((s, c) => s + c.lessons, 0)
  const searching = searchQuery.trim() !== ''

  // Group by category when browsing everything; a flat grid otherwise.
  const groups: { id: string; name: string; description: string | null; items: CatalogCourse[] }[] =
    activeCategory === 'all' && !searching
      ? [
          ...categories.map((cat) => ({ ...cat, items: filtered.filter((c) => c.category_id === cat.id) })),
          {
            id: 'other',
            name: categories.length ? 'More courses' : 'All courses',
            description: null,
            items: filtered.filter((c) => !c.category_id || !categories.some((cat) => cat.id === c.category_id)),
          },
        ].filter((g) => g.items.length > 0)
      : [{ id: 'results', name: '', description: categories.find((c) => c.id === activeCategory)?.description ?? null, items: filtered }]

  const chip = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm transition ${
      active ? 'bg-brand-primary font-medium text-black' : 'border border-brand-muted/40 text-brand-secondary hover:border-brand-primary hover:text-brand-text'
    }`

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="grid gap-8 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-end">
        <div>
          <h1 className="text-4xl font-medium sm:text-5xl">Courses</h1>
          <p className="mt-3 max-w-xl text-brand-secondary">
            {courses.length} courses and {totalLessons.toLocaleString()} lessons, each built around an official exam
            outline. More fields are on the way.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search courses, providers or topics"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search courses"
          className="w-full rounded-md border border-brand-muted/40 bg-brand-surface px-4 py-3 text-sm focus:border-brand-primary focus:outline-none"
        />
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-brand-muted/15 pb-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by field">
          <button type="button" onClick={() => setActiveCategory('all')} className={chip(activeCategory === 'all')}>
            All fields
          </button>
          {categories.map((cat) => (
            <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)} className={chip(activeCategory === cat.id)}>
              {cat.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-secondary">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-md border border-brand-muted/40 bg-brand-surface px-2 py-1.5 text-brand-text focus:border-brand-primary focus:outline-none"
          >
            <option value="popular">Most learners</option>
            <option value="az">Name</option>
            <option value="shortest">Shortest first</option>
          </select>
        </label>
      </div>

      {mine.length > 0 && activeCategory === 'all' && !searching && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-medium">Your courses</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c) => {
              const pct = c.lessons > 0 ? Math.round((c.completed / c.lessons) * 100) : 0
              return (
                <li key={c.id}>
                  <Link
                    href={`/courses/${c.slug}`}
                    className="block rounded-xl bg-brand-surface px-5 py-4 transition hover:bg-brand-surface-raised"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium">{c.title}</span>
                      <span className="shrink-0 text-xs text-brand-primary tabular-nums">{pct}%</span>
                    </span>
                    <span className="mt-3 block">
                      <DomainStrip sections={c.sections} showProgress />
                    </span>
                    <span className="mt-2 block text-xs text-brand-secondary">
                      {c.completed} of {c.lessons} lessons
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.id} className="mt-12">
          {g.name && <h2 className="text-2xl font-medium">{g.name}</h2>}
          {g.description && <p className="mt-1 max-w-2xl text-sm text-brand-secondary">{g.description}</p>}
          <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {g.items.map((c) => (
              <CourseCard key={c.id} c={c} />
            ))}
          </ul>
        </section>
      ))}
      {filtered.length === 0 && (
        <p className="mt-12 text-brand-secondary">
          No courses match &quot;{searchQuery}&quot;. Try another word, or ask for it below.
        </p>
      )}

      <section className="mt-20 grid gap-8 rounded-2xl border border-brand-muted/20 p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-2xl font-medium">Don&apos;t see what you need?</h2>
          <p className="mt-2 text-brand-secondary">
            Tell us which course or certification you&apos;d like next, in any field. Requests shape what gets built.
          </p>
        </div>
        {requestSubmitted ? (
          <p className="self-center text-brand-primary">Request sent. Thanks for telling us.</p>
        ) : (
          <form onSubmit={handleRequestSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Course or certification name"
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              className="w-full rounded-md border border-brand-muted/40 bg-brand-surface p-2.5 text-sm focus:border-brand-primary focus:outline-none"
              required
            />
            <textarea
              placeholder="Anything else? (optional)"
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              className="w-full rounded-md border border-brand-muted/40 bg-brand-surface p-2.5 text-sm focus:border-brand-primary focus:outline-none"
              rows={3}
            />
            {requestError && <p className="text-sm text-red-400">{requestError}</p>}
            <button
              type="submit"
              className="rounded-md bg-brand-primary px-6 py-2.5 text-sm font-medium text-black transition hover:bg-brand-primary-light"
            >
              Send request
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
