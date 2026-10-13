'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import LevelBadge from '@/components/LevelBadge'
import { timeAgo } from '@/lib/live'
import {
  fetchFriends,
  INVITE_MILESTONES,
  INVITE_XP,
  inviteLink,
  inviteMessage,
  onFriendsChanged,
  removeFriendship,
  respondToRequest,
  sendFriendRequest,
  sendResultMessage,
  type Friend,
  type FriendEvent,
  type FriendsData,
} from '@/lib/friends'
import { getAvatar } from '@/lib/avatars'
import { FlameIcon } from '@/components/Icons'

function eventText(e: FriendEvent) {
  if (e.kind === 'referral_bonus') {
    return (
      <>
        brought <span className="text-brand-text">{e.invited_alias || 'a friend'}</span> to Orivian
      </>
    )
  }
  if (e.kind === 'exam_attempt') {
    return (
      <>
        passed {e.attempt_type === 'final_exam' ? 'the practice exam' : 'the checkpoint for'}{' '}
        <span className="text-brand-text">{e.item || 'a domain'}</span>
        {e.course ? ` in ${e.course}` : ''}
      </>
    )
  }
  return (
    <>
      finished <span className="text-brand-text">{e.item || 'a lesson'}</span>
      {e.course ? ` in ${e.course}` : ''}
    </>
  )
}

function InviteCard({ code, joined, qualified }: { code: string; joined: number; qualified: number }) {
  const [copied, setCopied] = useState(false)
  // Only rendered after data loads in the browser, so navigator is available.
  const [canShare] = useState(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  const link = inviteLink(code)
  const message = inviteMessage(code)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the link is still selectable in the field */
    }
  }

  const next = INVITE_MILESTONES.find((m) => joined < m.friends)

  return (
    <section className="rounded-2xl border border-brand-primary/30 bg-gradient-to-br from-brand-surface-raised to-brand-surface p-6 sm:p-8">
      <h2 className="text-2xl font-medium">Invite a friend</h2>
      <p className="mt-2 max-w-2xl text-brand-secondary">
        When someone joins with your link, you&apos;re friends straight away. Once they finish their first lesson, you
        both get {INVITE_XP} XP.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          aria-label="Your invite link"
          className="min-w-0 flex-1 rounded-md border border-brand-muted/40 bg-brand-bg/60 px-3 py-2.5 text-sm text-brand-text"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex-1 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-black transition hover:bg-brand-primary-light sm:flex-none"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={() => navigator.share({ title: 'Join me on Orivian', text: message, url: link }).catch(() => {})}
              className="flex-1 rounded-md border border-brand-muted/40 px-5 py-2.5 text-sm transition hover:border-brand-primary sm:flex-none"
            >
              Share
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-brand-secondary">
        Or send it by{' '}
        <a
          href={`mailto:?subject=${encodeURIComponent('Join me on Orivian')}&body=${encodeURIComponent(message)}`}
          className="text-brand-primary hover:underline"
        >
          email
        </a>{' '}
        or{' '}
        <a href={`sms:?&body=${encodeURIComponent(message)}`} className="text-brand-primary hover:underline">
          text message
        </a>
        . Your code is <span className="font-medium tracking-wider text-brand-text">{code}</span>.
      </p>

      <div className="mt-7 border-t border-brand-muted/15 pt-5">
        <p className="mb-4 text-sm text-brand-secondary">
          {joined === 0
            ? 'Invite-only avatars unlock as friends join.'
            : `${joined} ${joined === 1 ? 'friend has' : 'friends have'} joined with your link, ${qualified} finished a first lesson.`}
          {next ? ` ${next.friends - joined} more for the next one.` : ' You’ve unlocked them all.'}
        </p>
        <ol className="grid grid-cols-3 gap-3">
          {INVITE_MILESTONES.map((m) => {
            const reached = joined >= m.friends
            const a = getAvatar(m.avatar)
            return (
              <li
                key={m.friends}
                className={`flex flex-col items-center gap-2 rounded-xl p-3 text-center ${
                  reached ? 'bg-brand-primary/10 ring-1 ring-brand-primary/40' : 'bg-brand-bg/40'
                }`}
              >
                <span className={reached ? '' : 'opacity-35 grayscale'}>
                  <Avatar avatarId={m.avatar} name={a?.name} size={44} />
                </span>
                <span className="text-sm">{a?.name}</span>
                <span className="text-xs text-brand-secondary">
                  {reached ? 'Unlocked' : `${m.friends} friend${m.friends === 1 ? '' : 's'} join`}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function AddByAlias({ onDone }: { onDone: () => void }) {
  const [alias, setAlias] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!alias.trim()) return
    setBusy(true)
    const r = await sendFriendRequest(alias.trim())
    setBusy(false)
    const ok = r.result === 'sent' || r.result === 'accepted'
    setMessage({ ok, text: sendResultMessage(r) })
    if (ok) {
      setAlias('')
      onDone()
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="friend-alias" className="mb-2 block font-medium">
        Add a friend by alias
      </label>
      <div className="flex gap-2">
        <input
          id="friend-alias"
          value={alias}
          onChange={(e) => {
            setAlias(e.target.value)
            setMessage(null)
          }}
          placeholder="Their public alias, e.g. QuietHeron311"
          maxLength={24}
          className="min-w-0 flex-1 rounded-md border border-brand-muted/40 bg-brand-surface-raised px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !alias.trim()}
          className="shrink-0 rounded-md border border-brand-muted/40 px-4 text-sm transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-40"
        >
          {busy ? 'Sending…' : 'Send request'}
        </button>
      </div>
      {message && <p className={`mt-2 text-sm ${message.ok ? 'text-brand-primary' : 'text-brand-secondary'}`}>{message.text}</p>}
    </form>
  )
}

function FriendMenu({ alias, onRemove }: { alias: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`More options for ${alias}`}
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-brand-secondary hover:bg-brand-surface-raised hover:text-brand-text"
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-brand-muted/25 bg-brand-surface-raised p-1 shadow-xl shadow-black/40">
          {confirming ? (
            <div className="p-3">
              <p className="mb-3 text-sm">Remove {alias} from your friends?</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="px-2 py-1 text-sm text-brand-secondary">
                  Keep
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="rounded-md bg-red-500/90 px-3 py-1 text-sm font-medium text-white hover:bg-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-brand-surface"
            >
              Remove friend
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function FriendCard({ f, onRemove }: { f: Friend; onRemove: () => void }) {
  return (
    <li className="rounded-xl bg-brand-surface p-5">
      <div className="flex items-start gap-3">
        <span className="relative shrink-0">
          <Avatar avatarId={f.avatar} name={f.alias} size={44} />
          {f.active_now && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-brand-surface bg-[#E4C473]" title="Studying now" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{f.alias}</span>
            <LevelBadge xp={f.total_xp} />
          </p>
          <p className="mt-0.5 text-sm text-brand-secondary">
            {f.active_now ? (
              <span className="text-brand-primary">Studying {f.current_course || 'now'}</span>
            ) : f.last_seen ? (
              `Last studied ${timeAgo(f.last_seen)}`
            ) : (
              'Hasn’t started studying yet'
            )}
          </p>
        </div>
        <FriendMenu alias={f.alias} onRemove={onRemove} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-brand-bg/50 py-2">
          <dt className="text-[11px] text-brand-secondary">Streak</dt>
          <dd className="tabular-nums">{f.streak > 0 ? <><FlameIcon className="inline h-3.5 w-3.5 -mt-0.5 mr-1 text-brand-primary" />{f.streak}</> : '0'}</dd>
        </div>
        <div className="rounded-lg bg-brand-bg/50 py-2">
          <dt className="text-[11px] text-brand-secondary">Lessons this week</dt>
          <dd className="tabular-nums">{f.lessons_week}</dd>
        </div>
        <div className="rounded-lg bg-brand-bg/50 py-2">
          <dt className="text-[11px] text-brand-secondary">XP this week</dt>
          <dd className="tabular-nums">{f.xp_week.toLocaleString()}</dd>
        </div>
      </dl>

      {f.courses.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {f.courses.slice(0, 3).map((c) => {
            const pct = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
            return (
              <li key={c.slug}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                  <Link href={`/courses/${c.slug}`} className="truncate text-brand-secondary hover:text-brand-primary">
                    {c.title}
                  </Link>
                  <span className="shrink-0 text-brand-muted tabular-nums">{pct}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-brand-muted/20">
                  <div className="h-full rounded-full bg-brand-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

export default function FriendsPage() {
  const router = useRouter()
  const [data, setData] = useState<FriendsData | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    fetchFriends().then((d) => {
      if (d) setData(d)
      else setFailed(true)
    })
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else load()
    })
    const off = onFriendsChanged(load)
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 60_000)
    return () => {
      off()
      clearInterval(id)
    }
  }, [router, load])

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 text-center text-sm text-brand-secondary">
        {failed ? 'Friends aren’t available yet (has migration 0016 been run?).' : 'Loading your friends…'}
      </main>
    )
  }

  const friends = data.friends.filter((f) => !f.is_you)
  const board = [...data.friends].sort((a, b) => b.xp_week - a.xp_week)

  return (
    <main className="mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-medium sm:text-4xl">Friends</h1>
        <p className="mt-2 max-w-2xl text-brand-secondary">
          Study alongside people you know. Friends see each other&apos;s alias, level, streak and course progress, never
          your real name or email.
        </p>
      </header>

      {data.invite.code && <InviteCard code={data.invite.code} joined={data.invite.joined} qualified={data.invite.qualified} />}

      {data.incoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-medium">Friend requests</h2>
          <ul className="divide-y divide-brand-muted/15 rounded-xl border border-brand-primary/25 bg-brand-surface">
            {data.incoming.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                <Avatar avatarId={r.avatar} name={r.alias} size={36} />
                <span className="font-medium">{r.alias}</span>
                {r.total_xp !== undefined && <LevelBadge xp={r.total_xp} />}
                <span className="text-xs text-brand-muted">{timeAgo(r.created_at)}</span>
                <span className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => respondToRequest(r.id, true)}
                    className="rounded-md bg-brand-primary px-4 py-1.5 text-sm font-medium text-black hover:bg-brand-primary-light"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToRequest(r.id, false)}
                    className="rounded-md border border-brand-muted/40 px-4 py-1.5 text-sm text-brand-secondary hover:text-brand-text"
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
        <section className="min-w-0">
          <h2 className="mb-4 text-xl font-medium">
            Your friends {friends.length > 0 && <span className="text-brand-secondary">({friends.length})</span>}
          </h2>
          {friends.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-muted/30 p-8 text-center">
              <p className="font-medium">No friends yet</p>
              <p className="mt-1 text-sm text-brand-secondary">
                Share your invite link above, or add someone by their alias.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {friends.map((f) => (
                <FriendCard key={f.friendship_id} f={f} onRemove={() => f.friendship_id && removeFriendship(f.friendship_id)} />
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-8">
          <section className="rounded-xl bg-brand-surface p-5">
            <AddByAlias onDone={load} />
            {data.outgoing.length > 0 && (
              <div className="mt-5 border-t border-brand-muted/15 pt-4">
                <p className="mb-2 text-sm text-brand-secondary">Waiting for an answer</p>
                <ul className="space-y-2">
                  {data.outgoing.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 text-sm">
                      <Avatar avatarId={r.avatar} name={r.alias} size={26} />
                      <span className="min-w-0 flex-1 truncate">{r.alias}</span>
                      <button
                        type="button"
                        onClick={() => removeFriendship(r.id)}
                        className="text-xs text-brand-muted hover:text-red-400"
                      >
                        Cancel
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {friends.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium">This week</h2>
              <ol className="divide-y divide-brand-muted/10 rounded-xl bg-brand-surface">
                {board.map((f, i) => (
                  <li key={f.friendship_id ?? 'you'} className={`flex items-center gap-3 px-4 py-2.5 ${f.is_you ? 'bg-brand-primary/10' : ''}`}>
                    <span className="w-5 text-sm text-brand-muted tabular-nums">{i + 1}</span>
                    <Avatar avatarId={f.avatar} name={f.alias} size={26} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {f.alias} {f.is_you && <span className="text-xs text-brand-primary">You</span>}
                    </span>
                    <span className="text-sm tabular-nums text-brand-secondary">{f.xp_week.toLocaleString()} XP</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {friends.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium">Recent activity</h2>
              {data.feed.length === 0 ? (
                <p className="text-sm text-brand-secondary">Nothing from your friends in the last two weeks.</p>
              ) : (
                <ul className="space-y-3">
                  {data.feed.slice(0, 15).map((e, i) => (
                    <li key={`${e.occurred_at}-${i}`} className="flex gap-3 text-sm">
                      <Avatar avatarId={e.avatar} name={e.alias} size={28} />
                      <p className="min-w-0 flex-1 text-brand-secondary">
                        <span className="text-brand-text">{e.alias}</span> {eventText(e)}
                        <span className="block text-xs text-brand-muted">{timeAgo(e.occurred_at)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>
    </main>
  )
}
