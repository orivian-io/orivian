'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const HEARTBEAT_INTERVAL_MS = 20000

/**
 * Sends a heartbeat roughly every 20s while the page is visible and
 * focused, so accumulated study time reflects actual engaged time rather
 * than "tab left open in the background." Pass null to pause tracking
 * (e.g. while a results screen is showing, not actively studying).
 *
 * A final heartbeat fires on unmount/tab-hide with `keepalive: true` so
 * the last partial interval survives navigation or a closed tab.
 */
export function useStudyTimer(lessonId: string | null) {
  const clientSessionIdRef = useRef<string>('')
  if (!clientSessionIdRef.current && typeof crypto !== 'undefined') {
    clientSessionIdRef.current = crypto.randomUUID()
  }

  useEffect(() => {
    if (!lessonId) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    const sendHeartbeat = async (keepalive = false) => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      try {
        await fetch('/api/study/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            lessonId,
            clientSessionId: clientSessionIdRef.current,
          }),
          keepalive,
        })
      } catch {
        // Best-effort - a missed heartbeat just means slightly less
        // recorded time, never something worth surfacing to the learner.
      }
    }

    const start = () => {
      if (intervalId) return
      sendHeartbeat()
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') sendHeartbeat()
      }, HEARTBEAT_INTERVAL_MS)
    }

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') start()
      else stop()
    }

    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', handleVisibility)

    const handleBeforeUnload = () => sendHeartbeat(true)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      sendHeartbeat(true)
    }
  }, [lessonId])
}