'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { aliasSaveError, generateAlias, validateAlias } from '@/lib/alias'
import { notifyProfileChanged } from '@/lib/stats'

// One-time prompt asking a learner to confirm (or change) the public alias
// they were given automatically. Shown until they choose one. Not shown in
// the middle of a lesson or exam.
export default function AliasPrompt({ userId }: { userId: string }) {
  const pathname = usePathname()
  const [needed, setNeeded] = useState(false)
  const [alias, setAlias] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase
      .from('profiles')
      .select('display_name, alias_confirmed')
      .eq('id', userId)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled || err || !data) return // e.g. migration not run yet
        if (data.alias_confirmed === false) {
          setAlias(data.display_name || generateAlias())
          setNeeded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!needed || pathname?.startsWith('/learn')) return null

  const save = async () => {
    const problem = validateAlias(alias)
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: alias.trim(), alias_confirmed: true })
      .eq('id', userId)
    setSaving(false)
    if (err) {
      setError(aliasSaveError(err))
      return
    }
    setNeeded(false)
    notifyProfileChanged()
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alias-title"
        className="w-full max-w-md rounded-xl border border-brand-muted/20 bg-brand-surface-raised p-6 shadow-2xl shadow-black/50"
      >
        <h2 id="alias-title" className="text-xl font-medium mb-1">
          Choose your public alias
        </h2>
        <p className="text-sm text-brand-secondary mb-5">
          This is how other learners see you on leaderboards and live activity. Your real name is never shown publicly.
          Keep the one we picked, shuffle for another, or make your own.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={alias}
            maxLength={24}
            onChange={(e) => {
              setAlias(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            aria-label="Public alias"
            className="min-w-0 flex-1 rounded-md border border-brand-muted/40 bg-brand-surface px-3 py-2 text-brand-text focus:border-brand-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setAlias(generateAlias())
              setError('')
            }}
            className="shrink-0 rounded-md border border-brand-muted/40 px-3 text-sm text-brand-secondary hover:border-brand-primary/50 hover:text-brand-primary transition"
            title="Suggest another alias"
          >
            🎲 Shuffle
          </button>
        </div>
        <p className="mt-1.5 text-xs text-brand-muted">3-24 characters: letters, numbers, spaces, dots, dashes or underscores.</p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-5 w-full rounded-md bg-brand-primary py-2.5 text-sm font-medium text-black transition hover:bg-brand-primary-light disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Use this alias'}
        </button>
        <p className="mt-3 text-center text-xs text-brand-muted">You can change it any time on your profile.</p>
      </div>
    </div>
  )
}
