import { supabaseAdmin } from '@/lib/supabase-admin'
import { NO_ACCOLADES, newlyEarnedBadges, type AccoladeCounts, type AccoladeKind, type AttemptAccolades } from '@/lib/badges'

// Server-only. Records any accolades a just-graded attempt earned and
// reports which badges that unlocked. Never fails the submission: if the
// accolade migration (0029) hasn't been run yet, or anything else goes
// wrong, the exam result still goes back - just without accolades
// (the perfect-score celebration still shows, based on the score alone).
export async function awardAccolades(attemptId: string, scorePercent: number): Promise<AttemptAccolades> {
  const fallback = { ...NO_ACCOLADES, perfect: scorePercent >= 100 }
  try {
    const { data, error } = await supabaseAdmin.rpc('award_exam_accolades', { p_attempt_id: attemptId })
    if (error || !data) return fallback
    const d = data as {
      awarded: AccoladeKind[] | null
      before: AccoladeCounts | null
      after: AccoladeCounts | null
      perfect: boolean
      repeat_perfect: boolean
    }
    return {
      perfect: !!d.perfect,
      repeatPerfect: !!d.repeat_perfect,
      accolades: d.awarded ?? [],
      newBadges: newlyEarnedBadges(d.before ?? {}, d.after ?? {}),
    }
  } catch {
    return fallback
  }
}
