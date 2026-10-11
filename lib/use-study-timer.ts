'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isNarrationPlaying } from '@/lib/narrator'

// After this long with no mouse, keyboard, touch or scroll activity (and no
// narration playing), the learner counts as away and the timer pauses.
const IDLE_AFTER_MS = 2 * 60 * 1000
// After switching to another tab, window or app, the timer keeps running
// for this long (a quick look at something else still counts), then pauses.
const AWAY_GRACE_MS = 60 * 1000
const HEARTBEAT_INTERVAL_MS = 20000
const TICK_INTERVAL_MS = 1000

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

type Display = { lessonId: string; totalSeconds: number; todaySeconds: number; paused: boolean }

/**
 * Tracks real, engaged study time for a lesson and returns live timers for
 * its course: `todaySeconds` and `totalSeconds` (null until the first sync),
 * plus `paused` while the learner is away.
 *
 * A second counts when the page is visible and focused and the learner
 * has interacted (or narration has played) within IDLE_AFTER_MS. After
 * switching away, the timer keeps counting for AWAY_GRACE_MS, then pauses.
 * Seconds since the last interaction are held as "tentative" and only
 * confirmed by the next interaction (or by switching away, which takes a
 * person), so time spent away from the keyboard is never recorded - if
 * the learner goes idle, the tentative time is dropped.
 *
 * Confirmed seconds are sent to the server every ~20s; the server credits
 * them (capped by real elapsed time) and returns authoritative course
 * totals, which become the new baseline for the on-screen timers.
 *
 * Pass null to stop tracking (e.g. on a results screen).
 */
export function useStudyTimer(lessonId: string | null) {
  const [display, setDisplay] = useState<Display | null>(null)

  useEffect(() => {
    if (!lessonId) return

    const clientSessionId = crypto.randomUUID()
    let baseTotal: number | null = null
    let baseToday = 0
    let inFlight = 0 // sent, not yet reflected in the baseline
    let pending = 0 // confirmed active seconds not yet sent
    let tentative = 0 // seconds since the last interaction, not yet confirmed
    let lastInteraction = Date.now()
    let idle = false
    let awaySince: number | null = null // when the learner switched away
    let disposed = false

    const engaged = () => document.visibilityState === 'visible' && document.hasFocus()

    const render = () => {
      if (disposed || baseTotal === null) return
      const local = inFlight + pending + tentative
      setDisplay({
        lessonId,
        totalSeconds: baseTotal + local,
        todaySeconds: baseToday + local,
        paused: idle || (!engaged() && (awaySince === null || Date.now() - awaySince > AWAY_GRACE_MS)),
      })
    }

    const confirmTentative = () => {
      pending += tentative
      tentative = 0
    }

    const sendHeartbeat = async (keepalive = false) => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const sending = pending
      pending = 0
      inFlight += sending

      try {
        const res = await fetch('/api/study/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ lessonId, clientSessionId, activeSeconds: sending }),
          keepalive,
        })
        inFlight -= sending
        if (!res.ok) {
          pending += sending
          return
        }
        // A keepalive request fires on unload - no page left to update.
        if (!keepalive) {
          const json = await res.json().catch(() => null)
          if (json && typeof json.courseStudySecondsTotal === 'number') {
            baseTotal = json.courseStudySecondsTotal
            baseToday = typeof json.courseStudySecondsToday === 'number' ? json.courseStudySecondsToday : 0
            render()
          }
        }
      } catch {
        // Network hiccup - keep the seconds and try again next heartbeat.
        inFlight -= sending
        pending += sending
      }
    }

    const markActivity = () => {
      lastInteraction = Date.now()
      confirmTentative()
      if (idle) {
        idle = false
        render()
      }
    }

    let lastActivityHandled = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - lastActivityHandled < 1000) return
      lastActivityHandled = now
      markActivity()
    }

    const tick = () => {
      if (!engaged()) {
        // Switched away: keep counting through the grace period, then pause.
        if (!idle && awaySince !== null && Date.now() - awaySince <= AWAY_GRACE_MS) pending += 1
        render()
        return
      }
      // Listening counts as studying, and is confirmed as it happens.
      const narrating = isNarrationPlaying()
      if (narrating) lastInteraction = Date.now()
      if (Date.now() - lastInteraction <= IDLE_AFTER_MS) {
        tentative += 1
        if (narrating) confirmTentative()
        idle = false
      } else if (!idle) {
        // Away: drop the unconfirmed time since the last interaction.
        tentative = 0
        idle = true
      }
      render()
    }

    const onLeave = () => {
      // Switching tabs or apps takes a person, so time up to now counts.
      if (!idle) confirmTentative()
      if (awaySince === null) awaySince = Date.now()
      render()
      if (pending > 0) void sendHeartbeat(true)
    }

    const onReturn = () => {
      awaySince = null
      markActivity()
      render()
    }

    const onVisibility = () => (document.visibilityState === 'visible' ? onReturn() : onLeave())

    // First heartbeat starts the session and loads the course totals.
    void sendHeartbeat()
    const tickId = setInterval(tick, TICK_INTERVAL_MS)
    const heartbeatId = setInterval(() => {
      if (pending > 0) void sendHeartbeat()
    }, HEARTBEAT_INTERVAL_MS)

    ACTIVITY_EVENTS.forEach((e) => document.addEventListener(e, onActivity, { capture: true, passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onLeave)
    window.addEventListener('focus', onReturn)
    const onUnload = () => {
      if (!idle) confirmTentative()
      if (pending > 0) void sendHeartbeat(true)
    }
    window.addEventListener('beforeunload', onUnload)

    return () => {
      disposed = true
      clearInterval(tickId)
      clearInterval(heartbeatId)
      ACTIVITY_EVENTS.forEach((e) => document.removeEventListener(e, onActivity, { capture: true }))
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('focus', onReturn)
      window.removeEventListener('beforeunload', onUnload)
      onUnload()
    }
  }, [lessonId])

  const current = display && display.lessonId === lessonId ? display : null
  return {
    todaySeconds: current?.todaySeconds ?? null,
    totalSeconds: current?.totalSeconds ?? null,
    paused: current?.paused ?? false,
  }
}
