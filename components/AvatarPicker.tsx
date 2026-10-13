'use client'

import { useEffect, useState } from 'react'
import Avatar from '@/components/Avatar'
import { AVATARS, isAvatarUnlocked, type AvatarDef } from '@/lib/avatars'
import { CloseIcon, LockIcon } from '@/components/Icons'

// Grid of Orivian's avatars: everyday ones, then ones earned by leveling up.
export default function AvatarPicker({
  open,
  current,
  level,
  invites = 0,
  name,
  onSelect,
  onClose,
}: {
  open: boolean
  current: string | null
  level: number
  invites?: number
  name: string | null
  onSelect: (id: string | null) => Promise<void>
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const choose = async (id: string | null) => {
    setSaving(true)
    setError('')
    try {
      await onSelect(id)
      onClose()
    } catch {
      setError("Couldn't save your avatar. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const everyday = AVATARS.filter((a) => a.unlockLevel === undefined && a.unlockInvites === undefined)
  const invited = AVATARS.filter((a) => a.unlockInvites !== undefined).sort((a, b) => (a.unlockInvites ?? 0) - (b.unlockInvites ?? 0))
  const invitedCount = invited.filter((a) => isAvatarUnlocked(a, level, invites)).length
  const earned = AVATARS.filter((a) => a.unlockLevel !== undefined).sort((a, b) => (a.unlockLevel ?? 0) - (b.unlockLevel ?? 0))
  const earnedCount = earned.filter((a) => (a.unlockLevel ?? 0) <= level).length

  const tile = (a: AvatarDef) => {
    const locked = !isAvatarUnlocked(a, level, invites)
    const lockLabel = a.unlockInvites
      ? `${a.unlockInvites} friend${a.unlockInvites === 1 ? '' : 's'}`
      : `Level ${a.unlockLevel}`
    const selected = current === a.id
    return (
      <button
        key={a.id}
        type="button"
        onClick={() => !locked && choose(a.id)}
        disabled={locked || saving}
        className={`relative flex flex-col items-center gap-1.5 rounded-lg p-2 transition ${
          selected ? 'bg-brand-primary/15 ring-1 ring-brand-primary' : locked ? 'cursor-not-allowed' : 'hover:bg-brand-surface'
        }`}
        title={
          locked
            ? a.unlockInvites
              ? `${a.name} - unlocks when ${a.unlockInvites} friend${a.unlockInvites === 1 ? '' : 's'} join with your invite`
              : `${a.name} - unlocks at Level ${a.unlockLevel}`
            : a.name
        }
      >
        <span className={locked ? 'opacity-25 grayscale' : ''}>
          <Avatar avatarId={a.id} size={48} />
        </span>
        {locked && (
          <LockIcon className="absolute top-[22px] h-4 w-4 text-brand-secondary" />
        )}
        <span className={`text-[11px] leading-tight text-center ${locked ? 'text-brand-muted' : 'text-brand-secondary'}`}>
          {locked ? lockLabel : a.name}
        </span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose your avatar"
        className="flex max-h-[88vh] w-full max-w-xl flex-col rounded-xl border border-brand-muted/20 bg-brand-surface-raised shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-muted/15 px-6 py-4">
          <h2 className="text-xl font-medium">Choose your avatar</h2>
          <button type="button" onClick={onClose} className="text-brand-secondary hover:text-brand-text" aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <p className="font-display italic text-sm mb-2 text-brand-secondary">Everyday</p>
          <div className="mb-6 grid grid-cols-4 gap-2 sm:grid-cols-6">
            <button
              type="button"
              onClick={() => choose(null)}
              disabled={saving}
              className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition ${current === null ? 'bg-brand-primary/15 ring-1 ring-brand-primary' : 'hover:bg-brand-surface'}`}
              title="Use your initials"
            >
              <Avatar avatarId={null} name={name} size={48} />
              <span className="text-[11px] text-brand-secondary">Initials</span>
            </button>
            {everyday.map(tile)}
          </div>

          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="font-display italic text-sm text-brand-secondary">Earned by leveling up</p>
            <p className="text-xs text-brand-muted tabular-nums">
              {earnedCount} of {earned.length} unlocked
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{earned.map(tile)}</div>

          <div className="mb-2 mt-6 flex items-baseline justify-between gap-3">
            <p className="font-display italic text-sm text-brand-secondary">Earned by inviting friends</p>
            <p className="text-xs text-brand-muted tabular-nums">
              {invitedCount} of {invited.length} unlocked
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{invited.map(tile)}</div>
          <p className="mt-2 text-xs text-brand-muted">
            Unlock these when friends sign up with your invite link from the{' '}
            <a href="/friends" className="text-brand-primary hover:underline">
              Friends
            </a>{' '}
            page.
          </p>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}
