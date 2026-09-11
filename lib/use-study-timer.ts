'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const HEARTBEAT_INTERVAL_MS = 20000
const TICK_INTERVAL_MS = 1000

/**
 * Sends a heartbeat roughly every 20s while the page is visible and
 * focused, so accumulated study time reflects actual engaged time rather
 * than "tab left open in the background." Pass null to pause tracking
 * (e.g. while a results screen is showing, not actively studying).
 *
 * Also returns two live-ticking counts for this lesson's course:
 * `todaySeconds` (studied today) and `totalSeconds` (studied all-time).
 * Each heartbeat response carries the server's authoritative totals,
 * which become the new baseline; between heartbeats, both tick up
 * locally once a second (only while the page is visible, and by the
 * same amount, since they share one clock) so the on-screen timers read
 * smoothly rather than jumping every 20s. Because they always snap back
 * to the server's true totals on sync, a backgrounded tab or a missed
 * heartbeat can't inflate what's displayed. Both are null until the
 * first heartbeat resolves.
 *
 * A final heartbeat fires on unmount/tab-hide with `keepalive: true` so
 * the last partial interval survives navigation or a closed tab.
 */
export function useStudyTimer(lessonId: string | null) {
  const clientSessionIdRef = useRef<string>('')
  if (!clientSessionIdRef.current && typeof crypto !== 'undefined') {
    clientSessionIdRef.current = crypto.randomUUID()
  }

  const baseTotalSecondsRef = useRef<number | null>(null)
  const baseTodaySecondsRef = useRef<number | null>(null)
  const baseSyncedAtRef = useRef<number>(0)
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null)
  const [todaySeconds, setTodaySeconds] = useState<number | null>(null)

  useEffect(() => {
    // Reset display state for the new lesson/tracking target.
    baseTotalSecondsRef.current = null
    baseTodaySecondsRef.current = null
    setTotalSeconds(null)
    setTodaySeconds(null)

    if (!lessonId) return

    let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null
    let tickIntervalId: ReturnType<typeof setInterval> | null = null

    const sendHeartbeat = async (keepalive = false) => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      try {
        const res = await fetch('/api/study/heartbeat', {
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

        // A keepalive request fires on unload - there's no page left to
        // update state on, and reading its body isn't reliable anyway.
        if (!keepalive) {
          const json = await res.json().catch(() => null)
          if (json && typeof json.courseStudySecondsTotal === 'number') {
            baseTotalSecondsRef.current = json.courseStudySecondsTotal
            baseTodaySecondsRef.current =
              typeof json.courseStudySecondsToday === 'number' ? json.courseStudySecondsToday : 0
            baseSyncedAtRef.current = Date.now()
            setTotalSeconds(baseTotalSecondsRef.current)
            setTodaySeconds(baseTodaySecondsRef.current)
          }
        }
      } catch {
        // Best-effort - a missed heartbeat just means slightly less
        // recorded time, never something worth surfacing to the learner.
      }
    }

    const startHeartbeats = () => {
      if (heartbeatIntervalId) return
      sendHeartbeat()
      heartbeatIntervalId = setInterval(() => {
        if (document.visibilityState === 'visible') sendHeartbeat()
      }, HEARTBEAT_INTERVAL_MS)
    }

    const stopHeartbeats = () => {
      if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId)
        heartbeatIntervalId = null
      }
    }

    const startTicking = () => {
      if (tickIntervalId) return
      tickIntervalId = setInterval(() => {
        if (baseTotalSecondsRef.current === null) return
        const elapsed = Math.max(0, Math.round((Date.now() - baseSyncedAtRef.current) / 1000))
        setTotalSeconds(baseTotalSecondsRef.current + elapsed)
        setTodaySeconds((baseTodaySecondsRef.current ?? 0) + elapsed)
      }, TICK_INTERVAL_MS)
    }

    const stopTicking = () => {
      if (tickIntervalId) {
        clearInterval(tickIntervalId)
        tickIntervalId = null
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startHeartbeats()
        startTicking()
      } else {
        stopHeartbeats()
        stopTicking()
      }
    }

    if (document.visibilityState === 'visible') {
      startHeartbeats()
      startTicking()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const handleBeforeUnload = () => sendHeartbeat(true)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      stopHeartbeats()
      stopTicking()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      sendHeartbeat(true)
    }
  }, [lessonId])

  return { todaySeconds, totalSeconds }
}