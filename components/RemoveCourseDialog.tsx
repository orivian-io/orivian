'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Confirms removing a course from "my courses" (un-enroll). Progress is
// kept unless the learner chooses to clear it.
export default function RemoveCourseDialog({
  course,
  onClose,
  onDone,
}: {
  course: { id: string; title: string } | null
  onClose: () => void
  onDone: () => void
}) {
  const [clearProgress, setClearProgress] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!course) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !working) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [course, working, onClose])

  if (!course) return null

  const remove = async () => {
    setWorking(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Please log in again.')
      const res = await fetch('/api/enrollments/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ courseId: course.id, clearProgress, resetStudyTime: clearProgress }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || "Couldn't remove the course. Try again.")
      }
      setWorking(false)
      setClearProgress(false)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove the course. Try again.")
      setWorking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4" onClick={() => !working && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-course-title"
        className="w-full max-w-md rounded-xl border border-brand-muted/20 bg-brand-surface-raised p-6 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="remove-course-title" className="mb-1 text-xl font-medium">
          Remove from your courses?
        </h2>
        <p className="mb-4 text-sm text-brand-secondary">{course.title}</p>
        <p className="mb-5 text-sm leading-relaxed text-brand-text/90">
          It will no longer show on your home page or profile. Your progress, notes and study time are kept, so if you
          enroll again later you&apos;ll pick up where you left off.
        </p>

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-brand-muted/20 bg-brand-surface p-3">
          <input
            type="checkbox"
            checked={clearProgress}
            onChange={(e) => setClearProgress(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#C19955]"
          />
          <span className="text-sm">
            <span className="block text-brand-text">Also clear my progress</span>
            <span className="mt-0.5 block text-xs text-brand-secondary">
              Removes completed lessons, scores and study time for this course. Notes are kept.
            </span>
          </span>
        </label>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            className="px-3 py-2 text-sm text-brand-secondary hover:text-brand-text disabled:opacity-40"
          >
            Keep course
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={working}
            className="rounded-md bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {working ? 'Removing…' : 'Remove course'}
          </button>
        </div>
      </div>
    </div>
  )
}
