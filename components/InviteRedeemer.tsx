'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { redeemInvite, takeRememberedInvite } from '@/lib/friends'
import { PartnerIcon } from '@/components/Icons'

// After someone signs up or logs in from an invite link, applies the invite
// they opened earlier (remembered in this browser) and says who they're
// now friends with.
export default function InviteRedeemer({ userId, accountInvite }: { userId: string; accountInvite?: string | null }) {
  const [alias, setAlias] = useState<string | null>(null)

  useEffect(() => {
    const code = takeRememberedInvite() || accountInvite
    if (!code) return
    redeemInvite(code).then((r) => {
      if (r?.result === 'friends' && r.alias) setAlias(r.alias)
      // Use the invite once, so unfriending later sticks.
      if (accountInvite) supabase.auth.updateUser({ data: { invite_code: null } })
    })
  }, [userId, accountInvite])

  useEffect(() => {
    if (!alias) return
    const id = setTimeout(() => setAlias(null), 8000)
    return () => clearTimeout(id)
  }, [alias])

  if (!alias) return null
  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-[80] flex w-[min(92vw,26rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-brand-primary/40 bg-brand-surface-raised px-4 py-3 text-sm shadow-2xl shadow-black/50"
    >
      <PartnerIcon className="h-5 w-5 shrink-0 text-brand-primary" />
      <span className="min-w-0 flex-1">
        You and <span className="text-brand-primary">{alias}</span> are now friends.
      </span>
      <Link href="/friends" className="shrink-0 text-brand-primary hover:underline" onClick={() => setAlias(null)}>
        View
      </Link>
    </div>
  )
}
