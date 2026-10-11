// Orivian's curated profile avatars. Learners pick one; uploads aren't
// supported. Avatars with `unlockLevel` are earned by reaching that level
// (the database enforces this too - see 0012_profile_avatars.sql).
//
// To add an avatar: add it here AND to the avatar_unlocks seed in SQL.

import type { ReactNode } from 'react'

export type AvatarDef = {
  id: string
  name: string
  background: string
  unlockLevel?: number
  icon: ReactNode // 24x24 line drawing, uses currentColor
}

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const SOFT = { fill: 'currentColor', fillOpacity: 0.3 } as const

// Earned avatars use metal tones that get brighter at higher levels.
function earnedBackground(level: number) {
  if (level >= 20) return '#E4C473'
  if (level >= 10) return '#C19955'
  return '#B07A4F'
}

const FREE: Omit<AvatarDef, 'unlockLevel'>[] = [
  {
    id: 'compass', name: 'Compass', background: '#173c40',
    icon: (<g {...S}><circle cx="12" cy="12" r="8.5" /><path d="M15 9 13.2 13.2 9 15l1.8-4.2Z" {...SOFT} /><path d="M12 3.5v1.6M12 18.9v1.6M3.5 12h1.6M18.9 12h1.6" /></g>),
  },
  {
    id: 'peak', name: 'Peak', background: '#1b2a4a',
    icon: (<g {...S}><path d="M2.5 19.5 9.5 7.5l3.8 6 2.4-3.4 5.8 9.4Z" /><path d="m8 10 1.5-2.5L11.2 10" /><circle cx="18" cy="5.5" r="1.6" /></g>),
  },
  {
    id: 'north-star', name: 'North Star', background: '#3a2341',
    icon: (<g {...S}><path d="m12 3 1.6 7.4L21 12l-7.4 1.6L12 21l-1.6-7.4L3 12l7.4-1.6Z" {...SOFT} /><path d="M5.5 5.5h.01M18.5 18.5h.01M18.5 5.5h.01" strokeWidth={2.4} /></g>),
  },
  {
    id: 'lantern', name: 'Lantern', background: '#4a2a1c',
    icon: (<g {...S}><path d="M9.5 5.5a2.5 2.5 0 0 1 5 0" /><path d="M8 7.5h8M8 18.5h8" /><rect x="8.5" y="7.5" width="7" height="11" rx="1.6" /><path d="M12 10.5c1.3 1.3 1.3 2.8 0 4-1.3-1.2-1.3-2.7 0-4Z" {...SOFT} /></g>),
  },
  {
    id: 'key', name: 'Key', background: '#1f3a2a',
    icon: (<g {...S}><circle cx="8" cy="12" r="3.6" /><path d="M11.6 12H20.5M17 12v3M19.5 12v2" /><circle cx="8" cy="12" r="1" fill="currentColor" /></g>),
  },
  {
    id: 'shield', name: 'Shield', background: '#2a3038',
    icon: (<g {...S}><path d="M12 3 19 6v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6Z" /><path d="m9 12 2 2 4-4" /></g>),
  },
  {
    id: 'book', name: 'Open Book', background: '#45202a',
    icon: (<g {...S}><path d="M3.5 5.8c2.8-1.2 5.8-1 8.5.7 2.7-1.7 5.7-1.9 8.5-.7v12.7c-2.8-1.2-5.8-1-8.5.7-2.7-1.7-5.7-1.9-8.5-.7Z" /><path d="M12 6.5v12.7" /></g>),
  },
  {
    id: 'lighthouse', name: 'Lighthouse', background: '#16324a',
    icon: (<g {...S}><path d="M10 9.5 9 20h6l-1-10.5Z" /><path d="M9.5 6h5v3.5h-5ZM9.5 6 12 3.8 14.5 6" /><path d="M16 6.7 20.5 5M16 8.6l4.5 1.6M6 20h12M9.6 14.6h4.8" /></g>),
  },
  {
    id: 'leaf', name: 'Leaf', background: '#24402c',
    icon: (<g {...S}><path d="M5 19c0-8.3 5.7-14 14-14 0 8.3-5.7 14-14 14Z" {...SOFT} /><path d="M5 19 14.5 9.5M9 15h3.5M11.5 12.5V9.8" /></g>),
  },
  {
    id: 'wave', name: 'Wave', background: '#123a4a',
    icon: (<g {...S}><path d="M3 9.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 18.5c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /></g>),
  },
  {
    id: 'sun', name: 'Sun', background: '#4a3418',
    icon: (<g {...S}><circle cx="12" cy="12" r="4" {...SOFT} /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></g>),
  },
  {
    id: 'moon', name: 'Moon', background: '#232a4f',
    icon: (<g {...S}><path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10Z" {...SOFT} /><path d="M16.5 4.5h.01M19.5 8h.01" strokeWidth={2.4} /></g>),
  },
  {
    id: 'feather', name: 'Feather', background: '#3d2433',
    icon: (<g {...S}><path d="M19.5 4.5C12 5 7 10 7 17h3.5c5 0 8.5-5 9-12.5Z" /><path d="M7 17 4.5 19.5M10 14l4-4M9.5 11h3" /></g>),
  },
  {
    id: 'hourglass', name: 'Hourglass', background: '#3a311d',
    icon: (<g {...S}><path d="M7 3.5h10M7 20.5h10M8 3.5c0 5 8 5.5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5.5-8 8.5s8 3.5 8 8.5" /><path d="M10 18.5h4l-2-2.2Z" {...SOFT} /></g>),
  },
  {
    id: 'anchor', name: 'Anchor', background: '#1a2f3f',
    icon: (<g {...S}><circle cx="12" cy="5" r="2" /><path d="M12 7v13.5M8.5 10.5h7" /><path d="M4.5 13.5c0 4 3.4 7 7.5 7s7.5-3 7.5-7M3 15.5l1.5-2.2 2 1.6M21 15.5l-1.5-2.2-2 1.6" /></g>),
  },
  {
    id: 'lightbulb', name: 'Lightbulb', background: '#2e3a1c',
    icon: (<g {...S}><path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5.6 1.2.6 1.9v1.3h6v-1.3c0-.7 0-1.4.6-1.9A6 6 0 0 0 12 3.5Z" {...SOFT} /><path d="M10 20.5h4M10.5 13l1.5-2 1.5 2" /></g>),
  },
]

const EARNED: (Omit<AvatarDef, 'background'> & { unlockLevel: number })[] = [
  {
    id: 'campfire', name: 'Campfire', unlockLevel: 2,
    icon: (<g {...S}><path d="M12 15c-3.2-1.6-3.2-5.4 0-9 3.2 3.6 3.2 7.4 0 9Z" {...SOFT} /><path d="M5 20.5 19 16.5M5 16.5l14 4" /></g>),
  },
  {
    id: 'pine', name: 'Pine', unlockLevel: 3,
    icon: (<g {...S}><path d="M12 3 7 10h3l-4 6.5h12L14 10h3Z" /><path d="M12 16.5v4" /></g>),
  },
  {
    id: 'bridge', name: 'Bridge', unlockLevel: 4,
    icon: (<g {...S}><path d="M2.5 15h19M4 15c2.5-5.5 13.5-5.5 16 0M7 12.2V19M17 12.2V19M12 10.4V15" /></g>),
  },
  {
    id: 'telescope', name: 'Telescope', unlockLevel: 5,
    icon: (<g {...S}><path d="m4 13.2 10.6-5.6 1.7 3.2L5.7 16.4Z" /><path d="m14.6 7.6 3.3-1.8 1.7 3.2-3.3 1.8" /><path d="M10.5 13.5 8 20.5M10.5 13.5 13 20.5M10.5 13.5v7" /></g>),
  },
  {
    id: 'sailboat', name: 'Sailboat', unlockLevel: 6,
    icon: (<g {...S}><path d="M4 17h16l-2.5 3.5h-11Z" /><path d="M12 3.5V17M12 4.5 18.5 15H12Z" /><path d="M10.8 7.5 6 15h4.8Z" {...SOFT} /></g>),
  },
  {
    id: 'balloon', name: 'Hot Air Balloon', unlockLevel: 7,
    icon: (<g {...S}><path d="M12 3a6 6 0 0 0-6 6c0 3.6 3.6 6.6 6 8.2 2.4-1.6 6-4.6 6-8.2a6 6 0 0 0-6-6Z" /><path d="M12 3c-1.6 2-1.6 12.2 0 14.2M12 3c1.6 2 1.6 12.2 0 14.2M10.3 17.5l.4 2h2.6l.4-2M10.7 19.5h2.6V21h-2.6Z" /></g>),
  },
  {
    id: 'snowflake', name: 'Snowflake', unlockLevel: 8,
    icon: (<g {...S}><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M10 4.6l2 1.6 2-1.6M10 19.4l2-1.6 2 1.6" /></g>),
  },
  {
    id: 'basecamp', name: 'Basecamp', unlockLevel: 10,
    icon: (<g {...S}><path d="M2.5 19.5 12 5l9.5 14.5Z" /><path d="m9.5 19.5 2.5-5 2.5 5M12 5 10.5 2.8M12 5l1.5-2.2" /></g>),
  },
  {
    id: 'rocket', name: 'Rocket', unlockLevel: 12,
    icon: (<g {...S}><path d="M12 3c3 2 4.5 5.5 4.5 9.5L14.5 16h-5l-2-3.5C7.5 8.5 9 5 12 3Z" /><circle cx="12" cy="9" r="1.6" /><path d="M7.5 12.5 5 15.5l3 .5M16.5 12.5l2.5 3-3 .5M10.5 18l1.5 3 1.5-3" /></g>),
  },
  {
    id: 'gem', name: 'Gem', unlockLevel: 14,
    icon: (<g {...S}><path d="M6.5 4h11L21 9l-9 11L3 9Z" /><path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" /></g>),
  },
  {
    id: 'planet', name: 'Planet', unlockLevel: 16,
    icon: (<g {...S}><circle cx="12" cy="12" r="5.2" {...SOFT} /><ellipse cx="12" cy="12" rx="10" ry="3.2" transform="rotate(-20 12 12)" /></g>),
  },
  {
    id: 'crown', name: 'Crown', unlockLevel: 18,
    icon: (<g {...S}><path d="M4 17.5 3 7.5l5 4 4-6 4 6 5-4-1 10Z" /><path d="M4 20.5h16" /></g>),
  },
  {
    id: 'trail-map', name: 'Trail Map', unlockLevel: 20,
    icon: (<g {...S}><path d="M3 6.5 9 4.5l6 2 6-2v13l-6 2-6-2-6 2Z" /><path d="M9 4.5v13M15 6.5v13" /><path d="M5.5 15c1.5-2 3-1 4.5-2.5s2.5-3 4.5-2.5 2.5-1.5 3.5-2.5" strokeDasharray="1.6 1.8" /></g>),
  },
  {
    id: 'trophy', name: 'Trophy', unlockLevel: 25,
    icon: (<g {...S}><path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0Z" /><path d="M7.5 6H5a2.5 2.5 0 0 0 2.5 3.5M16.5 6H19a2.5 2.5 0 0 1-2.5 3.5M12 13.5V17M9.5 17h5v3.5h-5Z" /></g>),
  },
  {
    id: 'summit-flag', name: 'Summit Flag', unlockLevel: 30,
    icon: (<g {...S}><path d="M2.5 20.5 10 9l3.6 5 2.4-2.6 5.5 9.1Z" /><path d="M10 9V3" /><path d="m10 3 5 1.6L10 6.4Z" {...SOFT} /></g>),
  },
  {
    id: 'laurel', name: 'Laurel', unlockLevel: 40,
    icon: (<g {...S}><path d="M7 19.5c-3.2-2.5-4.3-6.8-2.6-11.5M17 19.5c3.2-2.5 4.3-6.8 2.6-11.5" /><path d="M4.6 11.5c1.6.3 2.4 1.5 2.2 3M4.4 8c1.4.6 1.9 2 1.4 3.4M5.8 15.4c1.5-.2 2.6.7 2.8 2.2M19.4 11.5c-1.6.3-2.4 1.5-2.2 3M19.6 8c-1.4.6-1.9 2-1.4 3.4M18.2 15.4c-1.5-.2-2.6.7-2.8 2.2" /><path d="m12 8.5 1 2.1 2.2.3-1.6 1.6.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.6 2.2-.3Z" {...SOFT} /></g>),
  },
]

export const AVATARS: AvatarDef[] = [
  ...FREE,
  ...EARNED.map((a) => ({ ...a, background: earnedBackground(a.unlockLevel) })),
]

export function getAvatar(id: string | null | undefined): AvatarDef | null {
  return AVATARS.find((a) => a.id === id) ?? null
}

// Avatars that become available when moving from one level to a higher one.
export function avatarsUnlockedBetween(fromLevel: number, toLevel: number): AvatarDef[] {
  return AVATARS.filter((a) => a.unlockLevel !== undefined && a.unlockLevel > fromLevel && a.unlockLevel <= toLevel)
}

export function nextAvatarUnlock(level: number): AvatarDef | null {
  return (
    AVATARS.filter((a) => a.unlockLevel !== undefined && a.unlockLevel > level).sort(
      (a, b) => (a.unlockLevel ?? 0) - (b.unlockLevel ?? 0),
    )[0] ?? null
  )
}
