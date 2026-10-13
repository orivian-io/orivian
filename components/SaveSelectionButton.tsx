'use client'

import { useEffect, useState } from 'react'
import { NotesIcon } from '@/components/Icons'

// Shows a small "Save to notes" button next to text the learner selects
// inside the referenced element. Works with mouse and touch selection.
export default function SaveSelectionButton({
  containerRef,
  onSave,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  onSave: (text: string) => void
}) {
  const [pos, setPos] = useState<{ top: number; left: number; text: string } | null>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const sel = window.getSelection()
        const text = sel?.toString().replace(/\s+/g, ' ').trim() ?? ''
        if (!sel || sel.rangeCount === 0 || text.length < 3) {
          setPos(null)
          return
        }
        const range = sel.getRangeAt(0)
        const container = containerRef.current
        if (!container || !container.contains(range.commonAncestorContainer)) {
          setPos(null)
          return
        }
        const rect = range.getBoundingClientRect()
        const touch = window.matchMedia('(pointer: coarse)').matches
        // On touch screens the phone's own copy menu sits above the
        // selection, so put the button below it instead.
        const top = touch ? rect.bottom + 10 : rect.top - 44
        const left = Math.min(Math.max(rect.left + rect.width / 2, 80), window.innerWidth - 80)
        setPos({ top: Math.max(8, top), left, text: text.slice(0, 2000) })
      })
    }
    const hide = () => setPos(null)
    document.addEventListener('selectionchange', update)
    window.addEventListener('resize', hide)
    window.addEventListener('scroll', hide, true)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('selectionchange', update)
      window.removeEventListener('resize', hide)
      window.removeEventListener('scroll', hide, true)
    }
  }, [containerRef])

  if (!pos) return null

  return (
    <button
      type="button"
      // Keep the selection alive while clicking.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        onSave(pos.text)
        window.getSelection()?.removeAllRanges()
        setPos(null)
      }}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-[62] -translate-x-1/2 rounded-full border border-brand-primary/60 bg-brand-surface-raised px-3.5 py-1.5 text-sm font-medium text-brand-primary shadow-lg shadow-black/40 transition hover:bg-brand-primary hover:text-black"
    >
      <NotesIcon className="inline h-4 w-4 -mt-0.5 mr-1.5" />
      Save to notes
    </button>
  )
}
