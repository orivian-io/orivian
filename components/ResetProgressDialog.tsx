'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Confirmation dialog for resetting a learner's own progress on a course
// or a single lesson, with an option to also restart their study timer.
export default function ResetProgressDialog({
  open,
  onClose,
  scope,
  targetId,
  targetTitle,
  onDone,
}: {
  open: boolean
  onClose: () => void
  scope: 'course' | 'lesson'
  targetId: string
  targetTitle: string
  onDone: () => void
}) {
  const [resetTime, setResetTime] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !working) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, working, onClose])

  if (!open) return null

  const reset = async () => {
    setWorking(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Please log in again.')
      const res = await fetch('/api/progress/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...(scope === 'course' ? { courseId: targetId } : { lessonId: targetId }),
          resetStudyTime: resetTime,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Something went wrong.')
      }
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setWorking(false)
    }
  }

  const isCourse = scope === 'course'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4" onClick={() => !working && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        className="w-full max-w-md rounded-xl border border-brand-muted/20 bg-brand-surface-raised p-6 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="reset-title" className="text-xl font-medium mb-1">
          {isCourse ? 'Reset course progress?' : 'Reset lesson progress?'}
        </h2>
        <p className="text-sm text-brand-secondary mb-4">{targetTitle}</p>

        <p className="text-sm text-brand-text mb-2">This will clear:</p>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-brand-text/85">
          {isCourse ? (
            <>
              <li>Every completed lesson and recap in this course</li>
              <li>All mini-exam, checkpoint and practice exam scores</li>
            </>
          ) : (
            <>
              <li>This lesson&apos;s completion</li>
              <li>Your mini-exam attempts and scores for it</li>
            </>
          )}
        </ul>
        <p className="mb-5 text-sm text-brand-secondary">
          You&apos;ll stay enrolled, and your notes are kept.
        </p>

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-brand-muted/20 bg-brand-surface p-3">
          <input
            type="checkbox"
            checked={resetTime}
            onChange={(e) => setResetTime(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#C19955]"
          />
          <span className="text-sm">
            <span className="block text-brand-text">Also reset my study timer</span>
            <span className="block text-xs text-brand-secondary mt-0.5">
              {isCourse
                ? 'Your time for this course starts again from zero.'
                : "Time you've logged in this lesson is removed from your course timer."}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={working}
            className="rounded-md bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {working ? 'Resetting…' : isCourse ? 'Reset course' : 'Reset lesson'}
          </button>
        </div>
      </div>
    </div>
  )
}
