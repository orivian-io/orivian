'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FEEDBACK_CHANGED } from '@/components/admin/FeedbackInbox'

// "Admin" navbar link for the admin only, with a count of new reports.
export default function NavAdmin() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/admin/feedback?count=1', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => null)
      const json = res?.ok ? await res.json().catch(() => null) : null
      if (!cancelled && json) setCount(json.new ?? 0)
    }
    load()
    window.addEventListener(FEEDBACK_CHANGED, load)
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 120_000)
    return () => {
      cancelled = true
      window.removeEventListener(FEEDBACK_CHANGED, load)
      clearInterval(id)
    }
  }, [])

  return (
    <Link href={count > 0 ? '/admin#feedback' : '/admin'} className="relative hover:text-brand-primary transition">
      Admin
      {count > 0 && (
        <span
          className="absolute -right-3.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white tabular-nums"
          aria-label={`${count} new report${count === 1 ? '' : 's'}`}
        >
          {count}
        </span>
      )}
    </Link>
  )
}
