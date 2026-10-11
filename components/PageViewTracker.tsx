'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const NO_TRACK_KEY = 'orivian_no_track'
const SEEN_KEY = 'orivian_seen'

// Sends one page view per page to /api/track for the admin Traffic report.
// Skipped for the admin's own browser (see the admin page) and for visitors
// with Global Privacy Control switched on.
export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    let skip = false
    let landing = false
    try {
      skip = localStorage.getItem(NO_TRACK_KEY) === '1'
      landing = !sessionStorage.getItem(SEEN_KEY)
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      landing = true
    }
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
    if (skip || gpc) return

    const utm = landing ? new URLSearchParams(window.location.search).get('utm_source') : null
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetch('/api/track', {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ path: pathname, landing, referrer: landing ? document.referrer : '', utm }),
      }).catch(() => {})
    })
  }, [pathname])

  return null
}
