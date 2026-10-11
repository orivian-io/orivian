'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { timeAgo } from '@/lib/live'
import { fetchFriends, INVITE_XP, onFriendsChanged, type FriendsData } from '@/lib/friends'

// Home-page card: friends' week at a glance, or an invite nudge if you
// don't have any yet.
export default function FriendsGlance() {
  const [data, setData] = useState<FriendsData | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => fetchFriends().then((d) => !cancelled && d && setData(d))
    load()
    const off = onFriendsChanged(load)
    return () => {
      cancelled = true
      off()
    }
  }, [])

  if (!data) return null

  const friends = data.friends.filter((f) => !f.is_you)
  const pending = data.incoming.length

  if (friends.length === 0) {
    return (
      <section className="rounded-xl border border-brand-primary/25 bg-brand-surface p-5">
        <h2 className="font-medium">Study with a friend</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-secondary">
          Invite someone and you&apos;ll see each other&apos;s streaks and progress. You both get {INVITE_XP} XP when
          they finish their first lesson.
        </p>
        {pending > 0 && (
          <p className="mt-2 text-sm text-brand-primary">
            {pending} friend request{pending === 1 ? '' : 's'} waiting for you.
          </p>
        )}
        <Link
          href="/friends"
          className="mt-4 inline-block rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-black hover:bg-brand-primary-light"
        >
          {pending > 0 ? 'See requests' : 'Invite a friend'}
        </Link>
      </section>
    )
  }

  const top = [...data.friends].sort((a, b) => b.xp_week - a.xp_week).slice(0, 4)
  const latest = data.feed[0]

  return (
    <section className="rounded-xl bg-brand-surface p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-medium">Friends this week</h2>
        <Link href="/friends" className="text-sm text-brand-secondary hover:text-brand-primary">
          {pending > 0 ? `${pending} request${pending === 1 ? '' : 's'}` : 'See all'}
        </Link>
      </div>
      <ol className="space-y-2">
        {top.map((f, i) => (
          <li key={f.friendship_id ?? 'you'} className="flex items-center gap-3 text-sm">
            <span className="w-4 text-brand-muted tabular-nums">{i + 1}</span>
            <span className="relative">
              <Avatar avatarId={f.avatar} name={f.alias} size={26} />
              {f.active_now && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-surface bg-[#E4C473]" />
              )}
            </span>
            <span className={`min-w-0 flex-1 truncate ${f.is_you ? 'text-brand-primary' : ''}`}>
              {f.is_you ? 'You' : f.alias}
            </span>
            <span className="text-brand-secondary tabular-nums">{f.xp_week.toLocaleString()} XP</span>
          </li>
        ))}
      </ol>
      {latest && (
        <p className="mt-4 border-t border-brand-muted/15 pt-3 text-xs text-brand-secondary">
          <span className="text-brand-text">{latest.alias}</span>{' '}
          {latest.kind === 'lesson_completed'
            ? `finished ${latest.item || 'a lesson'}`
            : latest.kind === 'exam_attempt'
              ? `passed ${latest.item || 'an exam'}`
              : `brought ${latest.invited_alias || 'a friend'} to Orivian`}{' '}
          {timeAgo(latest.occurred_at)}
        </p>
      )}
    </section>
  )
}
