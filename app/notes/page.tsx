'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import NoteCard from '@/components/NoteCard'
import { createNote, listAllNotes, type NoteWithContext } from '@/lib/notes'

type CourseOption = { id: string; title: string; slug: string }

const GENERAL = '__general__'

// Central place for everything a learner has written or saved: lesson notes
// grouped by course and lesson, plus free-standing notes.
export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<NoteWithContext[] | null>(null)
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [loadError, setLoadError] = useState('')

  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftCourse, setDraftCourse] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const [notesResult, coursesResult] = await Promise.allSettled([
        listAllNotes(),
        supabase.from('courses').select('id, title, slug').eq('published', true).order('title'),
      ])
      if (notesResult.status === 'fulfilled') setNotes(notesResult.value)
      else {
        setNotes([])
        setLoadError("Couldn't load your notes. Refresh to try again.")
      }
      if (coursesResult.status === 'fulfilled') setCourses((coursesResult.value.data as CourseOption[]) ?? [])
    }
    load()
  }, [router])

  const filtered = useMemo(() => {
    if (!notes) return []
    const q = query.trim().toLowerCase()
    return notes.filter((n) => {
      if (filter === GENERAL && n.course) return false
      if (filter !== 'all' && filter !== GENERAL && n.course?.id !== filter) return false
      if (!q) return true
      return [n.body, n.quote, n.lesson?.title, n.course?.title].some((t) => t?.toLowerCase().includes(q))
    })
  }, [notes, query, filter])

  // Group: course -> lesson -> notes. Free-standing notes go under "General".
  const groups = useMemo(() => {
    const byCourse = new Map<string, { title: string; slug: string | null; lessons: Map<string, { title: string | null; notes: NoteWithContext[] }> }>()
    for (const n of filtered) {
      const courseKey = n.course?.id ?? GENERAL
      if (!byCourse.has(courseKey)) {
        byCourse.set(courseKey, { title: n.course?.title ?? 'General notes', slug: n.course?.slug ?? null, lessons: new Map() })
      }
      const course = byCourse.get(courseKey)!
      const lessonKey = n.lesson?.id ?? GENERAL
      if (!course.lessons.has(lessonKey)) course.lessons.set(lessonKey, { title: n.lesson?.title ?? null, notes: [] })
      course.lessons.get(lessonKey)!.notes.push(n)
    }
    return [...byCourse.entries()].sort(([a, ca], [b, cb]) => (a === GENERAL ? 1 : b === GENERAL ? -1 : ca.title.localeCompare(cb.title)))
  }, [filtered])

  const coursesWithNotes = useMemo(() => {
    const seen = new Map<string, string>()
    let hasGeneral = false
    for (const n of notes ?? []) {
      if (n.course) seen.set(n.course.id, n.course.title)
      else hasGeneral = true
    }
    return { list: [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])), hasGeneral }
  }, [notes])

  const addNote = async () => {
    const body = draft.trim()
    if (!body) return
    setAdding(true)
    setAddError('')
    try {
      const note = await createNote({ body, course_id: draftCourse || null })
      const course = courses.find((c) => c.id === draftCourse) ?? null
      setNotes((prev) => [{ ...note, lesson: null, course }, ...(prev ?? [])])
      setDraft('')
      setComposerOpen(false)
    } catch {
      setAddError("Couldn't save your note. Check your connection and try again.")
    } finally {
      setAdding(false)
    }
  }

  const updateLocal = (id: string, body: string, updated_at: string) =>
    setNotes((prev) => (prev ?? []).map((n) => (n.id === id ? { ...n, body, updated_at } : n)))
  const removeLocal = (id: string) => setNotes((prev) => (prev ?? []).filter((n) => n.id !== id))

  if (notes === null) {
    return <main className="max-w-4xl mx-auto py-24 px-6 text-center text-sm text-brand-secondary">Loading your notes…</main>
  }

  return (
    <main className="max-w-4xl mx-auto w-full py-14 px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-medium mb-2">My notes</h1>
          <p className="text-brand-secondary text-sm">
            Everything you&apos;ve written or saved while studying. Private to you.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComposerOpen((o) => !o)}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-black transition hover:bg-brand-primary-light"
        >
          + New note
        </button>
      </div>

      {composerOpen && (
        <div className="mb-8 rounded-xl border border-brand-muted/20 bg-brand-surface p-4">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void addNote()
              }
            }}
            rows={4}
            placeholder="A topic to revisit, a mnemonic, a question for later…"
            className="w-full resize-none rounded-md border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm leading-relaxed text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <select
              value={draftCourse}
              onChange={(e) => setDraftCourse(e.target.value)}
              className="rounded-md border border-brand-muted/30 bg-brand-bg px-2.5 py-1.5 text-sm text-brand-text focus:border-brand-primary focus:outline-none"
              aria-label="Course for this note"
            >
              <option value="">General (no course)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setComposerOpen(false)} className="text-sm text-brand-secondary hover:text-brand-text">
                Cancel
              </button>
              <button
                type="button"
                onClick={addNote}
                disabled={adding || !draft.trim()}
                className="rounded-md bg-brand-primary px-4 py-1.5 text-sm font-medium text-black transition hover:bg-brand-primary-light disabled:opacity-40"
              >
                {adding ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
          {addError && <p className="mt-2 text-xs text-red-400">{addError}</p>}
        </div>
      )}

      {notes.length > 0 && (
        <div className="mb-8 space-y-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes…"
            className="w-full rounded-md border border-brand-muted/30 bg-brand-surface px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-none"
          />
          {(coursesWithNotes.list.length > 1 || (coursesWithNotes.list.length > 0 && coursesWithNotes.hasGeneral)) && (
            <div className="flex flex-wrap gap-2">
              {[['all', 'All'] as const, ...coursesWithNotes.list, ...(coursesWithNotes.hasGeneral ? [[GENERAL, 'General'] as const] : [])].map(
                ([id, title]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      filter === id
                        ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                        : 'border-brand-muted/30 text-brand-secondary hover:text-brand-text'
                    }`}
                  >
                    {title}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      )}

      {loadError && <p className="mb-6 text-sm text-red-400">{loadError}</p>}

      {notes.length === 0 && !loadError ? (
        <div className="rounded-xl border border-dashed border-brand-muted/30 p-10 text-center">
          <p className="text-brand-text mb-2">No notes yet</p>
          <p className="text-sm text-brand-secondary max-w-md mx-auto leading-relaxed">
            Open a lesson and tap <span className="text-brand-primary">📝 Notes</span>, or select any text in a lesson and
            choose <span className="text-brand-primary">Save to notes</span>. You can also add a general note here.
          </p>
        </div>
      ) : filtered.length === 0 && notes.length > 0 ? (
        <p className="text-sm text-brand-secondary">No notes match your search.</p>
      ) : (
        <div className="space-y-12">
          {groups.map(([courseKey, course]) => (
            <section key={courseKey}>
              <h2 className="font-display text-2xl font-medium mb-5">{course.title}</h2>
              <div className="space-y-8">
                {[...course.lessons.entries()].map(([lessonKey, lesson]) => (
                  <div key={lessonKey}>
                    {lesson.title && course.slug ? (
                      <Link
                        href={`/learn/${course.slug}/${lessonKey}`}
                        className="mb-3 inline-flex items-center gap-2 text-sm text-brand-secondary hover:text-brand-primary transition"
                      >
                        {lesson.title} <span aria-hidden="true">→</span>
                      </Link>
                    ) : (
                      courseKey !== GENERAL && <p className="mb-3 text-sm text-brand-secondary">Course notes</p>
                    )}
                    <div className="space-y-3">
                      {lesson.notes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onSaved={(saved) => updateLocal(saved.id, saved.body, saved.updated_at)}
                          onDeleted={removeLocal}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
