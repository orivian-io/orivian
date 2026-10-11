'use client'

import { useEffect, useRef, useState } from 'react'
import { deleteNote, formatNoteDate, updateNote, type Note } from '@/lib/notes'

// One note: an optional saved quote from a lesson plus the learner's own
// text. Click the text to edit; changes save automatically.
export default function NoteCard({
  note,
  autoFocus = false,
  context,
  onSaved,
  onDeleted,
}: {
  note: Note
  autoFocus?: boolean
  context?: React.ReactNode
  onSaved?: (note: Note) => void
  onDeleted?: (id: string) => void
}) {
  const [editing, setEditing] = useState(autoFocus)
  const [draft, setDraft] = useState(note.body)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastSaved = useRef(note.body)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [editing])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const save = async (body: string) => {
    if (body === lastSaved.current) return
    setStatus('saving')
    try {
      const saved = await updateNote(note.id, body)
      lastSaved.current = body
      setStatus('saved')
      onSaved?.(saved)
    } catch {
      setStatus('error')
    }
  }

  const onChange = (value: string) => {
    setDraft(value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void save(value), 800)
  }

  const finishEditing = () => {
    if (timer.current) clearTimeout(timer.current)
    void save(draft)
    setEditing(false)
  }

  const remove = async () => {
    try {
      await deleteNote(note.id)
      onDeleted?.(note.id)
    } catch {
      setStatus('error')
      setConfirmDelete(false)
    }
  }

  return (
    <div className="group rounded-xl border border-brand-muted/20 bg-brand-surface p-4">
      {context && <div className="mb-2 text-xs text-brand-secondary">{context}</div>}

      {note.quote && (
        <blockquote className="mb-3 border-l-2 border-brand-primary/70 pl-3 text-sm italic leading-relaxed text-brand-text/85">
          {note.quote}
        </blockquote>
      )}

      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
              e.preventDefault()
              finishEditing()
            }
          }}
          placeholder={note.quote ? 'Add your thoughts (optional)…' : 'Write a note…'}
          rows={2}
          className="w-full resize-none rounded-md border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm leading-relaxed text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full text-left text-sm leading-relaxed whitespace-pre-wrap text-brand-text"
          title="Click to edit"
        >
          {draft || <span className="text-brand-muted">{note.quote ? 'Add your thoughts…' : 'Empty note - click to write'}</span>}
        </button>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-brand-muted">
        <span>
          {formatNoteDate(note.created_at)}
          {status === 'saving' && ' · Saving…'}
          {status === 'saved' && ' · Saved'}
          {status === 'error' && <span className="text-red-400"> · Couldn&apos;t save - check your connection</span>}
        </span>
        {confirmDelete ? (
          <span className="flex items-center gap-3">
            <span>Delete this note?</span>
            <button type="button" onClick={remove} className="text-red-400 hover:text-red-300">
              Delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="hover:text-brand-text">
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="opacity-70 transition hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
