'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// "More" menu for one of the learner's courses: open, reset, remove.
export default function CourseMenu({
  slug,
  title,
  onReset,
  onRemove,
}: {
  slug: string
  title: string
  onReset: () => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item = 'block w-full px-4 py-2 text-left text-sm hover:bg-brand-surface'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More options for ${title}`}
        className="flex h-9 w-9 items-center justify-center rounded-md text-lg text-brand-secondary transition hover:bg-brand-surface-raised hover:text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-30 w-56 overflow-hidden rounded-lg border border-brand-muted/25 bg-brand-surface-raised py-1 shadow-xl shadow-black/40"
        >
          <Link href={`/courses/${slug}`} role="menuitem" className={item} onClick={() => setOpen(false)}>
            Go to course page
          </Link>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false)
              onReset()
            }}
          >
            Reset progress
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${item} text-red-400`}
            onClick={() => {
              setOpen(false)
              onRemove()
            }}
          >
            Remove from my courses
          </button>
        </div>
      )}
    </div>
  )
}
