'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ActivityMap from '@/components/ActivityMap'
import Avatar from '@/components/Avatar'
import { fetchLiveActivity, type LiveActivity } from '@/lib/live'

// Small "who's studying" card for the home page. The full view is /live.
export default function LiveGlance() {
  const [data, setData] = useState<LiveActivity | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => fetchLiveActivity().then((d) => !cancelled && d && setData(d))
    load()
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 30_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (!data) return <div className="h-72 animate-pulse rounded-xl bg-brand-surface" />

  const faces = [...data.active_now, ...data.recent].slice(0, 5)
  const { now, week } = data.totals

  return (
    <section className="rounded-xl bg-brand-surface p-5 sm:p-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 font-medium">
          <span className="relative inline-flex h-2 w-2" aria-hidden="true">
            {now > 0 && <span className="absolute inline-flex h-full w-full rounded-full bg-[#E4C473] opacity-60 motion-safe:animate-ping" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${now > 0 ? 'bg-[#E4C473]' : 'bg-brand-muted'}`} />
          </span>
          Live on Orivian
        </h2>
        <Link href="/live" className="text-sm text-brand-secondary hover:text-brand-primary">
          See everyone
        </Link>
      </div>
      <ActivityMap regions={data.map} />
      <div className="mt-3 flex items-center gap-3">
        {faces.length > 0 && (
          <div className="flex -space-x-2">
            {faces.map((p, i) => (
              <span key={`${p.alias}-${i}`} className="rounded-full ring-2 ring-brand-surface" title={p.alias}>
                <Avatar avatarId={p.avatar} name={p.alias} size={28} />
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-brand-secondary">
          {now > 0 ? (
            <>
              <span className="text-brand-text">{now}</span> studying now, {week} this week
            </>
          ) : week > 0 ? (
            <>
              Quiet right now. <span className="text-brand-text">{week}</span> studied this week.
            </>
          ) : (
            'No one else yet this week.'
          )}
        </p>
      </div>
    </section>
  )
}
