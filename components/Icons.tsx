import type { SVGProps } from 'react'

// Orivian's interface icons. Same 24px grid, 1.5 stroke and round joins as
// the compass mark and the domain icons, so everything reads as one family
// (in place of emoji, which render differently on every device).

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
}

const sized = (props: IconProps) => ({ ...base, width: '1em', height: '1em', ...props })

// Field notebook with a ribbon
export function NotesIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6z" />
      <path d="M6 3.5v17" />
      <path d="M9.5 8h5.5M9.5 11.5h5.5M9.5 15h3" />
    </svg>
  )
}

// Pocket watch
export function TimerIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 13.5V10M10 3.5h4M12 3.5v3" />
    </svg>
  )
}

// Elevation profile - total ground covered
export function ElevationIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M3 19l5-8 3.5 4.5L15 8l6 11z" />
      <path d="M3 19h18" />
    </svg>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M9 6.5v11M15 6.5v11" />
    </svg>
  )
}

export function SoundIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  )
}

export function StopIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  )
}

// Campfire - a streak kept burning
export function FlameIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M12 3.5c.5 3 4.5 4.5 4.5 9a4.5 4.5 0 0 1-9 0c0-2 1-3.2 2-4 .2 1.6 1 2.5 2 2.5-.5-2.5-.5-5 .5-7.5z" />
      <path d="M5 20.5l14-2.5M19 20.5L5 18" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  )
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M15 5l4 4L9 19H5v-4z" />
      <path d="M13 7l4 4" />
    </svg>
  )
}

// Two crossed paths - shuffle
export function ShuffleIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M3.5 7h3c4.5 0 6.5 10 11 10h3M3.5 17h3c1.8 0 3.1-1.6 4.2-3.6M13.3 9.6C14.4 8.2 15.7 7 17.5 7h3" />
      <path d="M18 4.5L20.5 7 18 9.5M18 14.5l2.5 2.5-2.5 2.5" />
    </svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

// Trail marker flag
export function FlagIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M6 21V4" />
      <path d="M6 4.5h11l-2.5 4 2.5 4H6" />
    </svg>
  )
}

// Two figures - a study partner
export function PartnerIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M15 14.2a4.5 4.5 0 0 1 5.5 4.3" />
    </svg>
  )
}

// Rising ridge - strengths
export function SummitIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M2.5 19.5l6.5-11 3.5 5.5 2.5-3.5 6.5 9z" />
      <path d="M9 8.5V4l3 1.2L9 6.4" />
    </svg>
  )
}

// Bearing - where to aim next
export function BearingIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 3.5V6M12 18v2.5M3.5 12H6M18 12h2.5" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function RetryIcon(props: IconProps) {
  return (
    <svg {...sized(props)}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4.5H15" />
    </svg>
  )
}

// The Orivian compass, with a needle that can swing and settle - used for
// the one celebratory moment (passing an exam). Respects reduced motion.
export function CompassMoment({ settled = true, className = '' }: { settled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1="32"
          y1="7"
          x2="32"
          y2="11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      <g className={settled ? 'orivian-needle-settle' : ''} style={{ transformOrigin: '32px 32px' }}>
        <path d="M32 14l5 18h-10z" fill="currentColor" />
        <path d="M32 50l-5-18h10z" fill="currentColor" opacity="0.35" />
      </g>
      <circle cx="32" cy="32" r="2.5" fill="var(--color-brand-bg)" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
