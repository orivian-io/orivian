import type { BadgeGlyph } from '@/lib/badges'

// Badge medallion: the compass bezel from the logo mark (ring + cardinal
// ticks) around a glyph drawn on the same 24px / 1.5-stroke grid as
// components/Icons.tsx, so badges read as part of the icon family.

function Glyph({ glyph }: { glyph: BadgeGlyph }) {
  switch (glyph) {
    case 'compass':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 4.5l2.6 7.5h-5.2z" fill="currentColor" />
          <path d="M12 19.5l-2.6-7.5h5.2z" opacity="0.45" />
        </>
      )
    case 'trail':
      return (
        <>
          <path d="M4 19.5c4 0 4-5 8-5s4-5 8-5" strokeDasharray="2 2.6" />
          <circle cx="4" cy="19.5" r="1.4" fill="currentColor" />
          <path d="M19 9.5V3.5l3 1.2-3 1.3" />
        </>
      )
    case 'star':
      return <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" />
    case 'map':
      return (
        <>
          <path d="M3 6.5l6-2.3 6 2.3 6-2.3v13.3l-6 2.3-6-2.3-6 2.3z" />
          <path d="M9 4.2v13.3M15 6.5v13.3" />
        </>
      )
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
        </>
      )
    case 'ridge':
      return (
        <>
          <path d="M2.5 18.5l6-9.5 4 5.5 3-3.5 6 7.5z" />
          <path d="M7 12.5l1.5-1 1.5 1.5" />
        </>
      )
    case 'wind':
      return <path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h6" />
    case 'flag':
      return (
        <>
          <path d="M2.5 19.5l6.5-11 3.5 5.5 2.5-3.5 6.5 9z" />
          <path d="M9 8.5V3.5l3.5 1.4L9 6.3" />
        </>
      )
    case 'cloud':
      return (
        <>
          <path d="M5.5 13.5L12 4l6.5 9.5" />
          <path d="M10 7.5l2 1.5 2-1.5" />
          <path d="M3 17c1.6-1.8 3.4-1.8 5 0 1.6-1.8 3.4-1.8 5 0 1.6-1.8 3.4-1.8 5 0 .9-1 1.9-1.4 3-1.2" />
        </>
      )
  }
}

export default function BadgeMedal({
  glyph,
  earned = true,
  className = 'h-14 w-14',
}: {
  glyph: BadgeGlyph
  earned?: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} ${earned ? 'text-brand-primary' : 'text-brand-muted/50'}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="32"
        cy="32"
        r="29"
        fill={earned ? 'rgba(193,153,85,0.12)' : 'var(--color-brand-surface-raised)'}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="32" r="23.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1="32"
          y1="3"
          x2="32"
          y2="7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      <g
        transform="translate(18 18) scale(1.1667)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Glyph glyph={glyph} />
      </g>
    </svg>
  )
}
