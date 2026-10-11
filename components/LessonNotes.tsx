'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import NoteCard from '@/components/NoteCard'
import { createNote, type Note } from '@/lib/notes'

// Slide-over notes panel inside the lesson player. Notes written here are
// linked to the lesson and its course automatically.
export default function LessonNotes({
  open,
  onClose,
  lessonId,
  courseId,
  lessonTitle,
  notes,
  setNotes,
  focusNoteId,
}: {
  open: boolean
  onClose: () => void
  lessonId: string
  courseId: string | null
  lessonTitle: string
  notes: Note[] | null
  setNotes: (update: (prev: Note[]) => Note[]) => void
  focusNoteId: string | null
}) {
  const [draft, setDraft] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const add = async () => {
    const body = draft.trim()
    if (!body) return
    setAdding(true)
    setError('')
    try {
      const note = await createNote({ body, lesson_id: lessonId, course_id: courseId })
      setNotes((prev) => [note, ...prev])
      setDraft('')
      composerRef.current?.focus()
    } catch {
      setError("Couldn't save your note. Check your connection and try again.")
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity sm:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Lesson notes"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[61] flex w-full max-w-[26rem] flex-col border-l border-brand-muted/20 bg-brand-surface-raised shadow-2xl shadow-black/50 transition-transform duration-200 ${
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-brand-muted/15 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-brand-primary">My notes</p>
            <p className="truncate text-sm text-brand-secondary" title={lessonTitle}>
              {lessonTitle}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-brand-secondary hover:text-brand-text" aria-label="Close notes">
            ✕
          </button>
        </div>

        <div className="border-b border-brand-muted/15 px-5 py-4">
          <textarea
            ref={composerRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void add()
              }
            }}
            rows={3}
            placeholder="Write a note about this lesson…"
            className="w-full resize-none rounded-md border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm leading-relaxed text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-brand-muted">Tip: select text in the lesson to save it here.</span>
            <button
              type="button"
              onClick={add}
              disabled={adding || !draft.trim()}
              className="shrink-0 rounded-md bg-brand-primary px-3 py-1.5 text-sm font-medium text-black transition hover:bg-brand-primary-light disabled:opacity-40"
            >
              {adding ? 'Saving…' : 'Add note'}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {notes === null ? (
            <p className="text-sm text-brand-muted">Loading notes…</p>
          ) : notes.length === 0 ? (
            <p className="text-sm leading-relaxed text-brand-muted">
              No notes for this lesson yet. Notes are private to you and stay with your account on every device.
            </p>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                autoFocus={note.id === focusNoteId}
                onSaved={(saved) => setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)))}
                onDeleted={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
              />
            ))
          )}
        </div>

        <div className="border-t border-brand-muted/15 px-5 py-3 text-right">
          <Link href="/notes" className="text-sm text-brand-primary hover:underline">
            All my notes →
          </Link>
        </div>
      </aside>
    </>
  )
}
