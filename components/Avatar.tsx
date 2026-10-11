import { getAvatar } from '@/lib/avatars'

function initials(name: string | null | undefined) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

// A learner's chosen avatar, or their initials if they haven't picked one.
export default function Avatar({
  avatarId,
  name,
  size = 32,
  className = '',
}: {
  avatarId: string | null | undefined
  name?: string | null
  size?: number
  className?: string
}) {
  const avatar = getAvatar(avatarId)
  const earned = avatar?.unlockLevel !== undefined

  if (!avatar) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-surface-raised border border-brand-muted/30 font-medium text-brand-primary select-none ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        aria-hidden="true"
      >
        {initials(name)}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full select-none ${earned ? 'ring-1 ring-brand-primary-light/60' : avatar?.unlockInvites ? 'ring-1 ring-[#8fb8c4]/60' : ''} ${className}`}
      style={{ width: size, height: size, background: avatar.background, color: earned ? '#0A0C0F' : '#E4C473' }}
      title={avatar.name}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6}>
        {avatar.icon}
      </svg>
    </span>
  )
}
