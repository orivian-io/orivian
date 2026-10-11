'use client'

// Learner notes. Rows are protected by row-level security, so each learner
// only ever reads and writes their own notes (see 0006_learner_notes.sql).

import { supabase } from '@/lib/supabase'

export type Note = {
  id: string
  body: string
  quote: string | null
  course_id: string | null
  lesson_id: string | null
  created_at: string
  updated_at: string
}

export type NoteWithContext = Note & {
  lesson: { id: string; title: string } | null
  course: { id: string; title: string; slug: string } | null
}

const COLUMNS = 'id, body, quote, course_id, lesson_id, created_at, updated_at'

export async function listLessonNotes(lessonId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(COLUMNS)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listAllNotes(): Promise<NoteWithContext[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(`${COLUMNS}, lessons(id, title), courses(id, title, slug)`)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const { lessons, courses, ...note } = row as Note & { lessons: unknown; courses: unknown }
    const lesson = (Array.isArray(lessons) ? lessons[0] : lessons) as NoteWithContext['lesson']
    const course = (Array.isArray(courses) ? courses[0] : courses) as NoteWithContext['course']
    return { ...note, lesson: lesson ?? null, course: course ?? null }
  })
}

export async function createNote(fields: {
  body?: string
  quote?: string | null
  course_id?: string | null
  lesson_id?: string | null
}): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ body: fields.body ?? '', quote: fields.quote ?? null, course_id: fields.course_id ?? null, lesson_id: fields.lesson_id ?? null })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function updateNote(id: string, body: string): Promise<Note> {
  const { data, error } = await supabase.from('notes').update({ body }).eq('id', id).select(COLUMNS).single()
  if (error) throw error
  return data
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

export function formatNoteDate(iso: string) {
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}
