'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchFriendsSummary, onFriendsChanged } from '@/lib/friends'

// "Friends" navbar link, with a count of requests waiting for an answer.
export default function NavFriends() {
  const [pending, setPending] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = () => fetchFriendsSummary().then((s) => !cancelled && setPending(s?.pending ?? 0))
    load()
    const off = onFriendsChanged(load)
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 120_000)
    return () => {
      cancelled = true
      off()
      clearInterval(id)
    }
  }, [])

  return (
    <Link href="/friends" className="relative hover:text-brand-primary transition">
      Friends
      {pending > 0 && (
        <span
          className="absolute -right-3.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-semibold text-black tabular-nums"
          aria-label={`${pending} friend request${pending === 1 ? '' : 's'}`}
        >
          {pending}
        </span>
      )}
    </Link>
  )
}
