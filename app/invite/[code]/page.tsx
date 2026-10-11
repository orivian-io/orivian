'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/Avatar'
import LevelBadge from '@/components/LevelBadge'
import { fetchInvitePreview, INVITE_XP, redeemInvite, rememberInvite } from '@/lib/friends'

type Preview = { alias: string; avatar: string | null; total_xp: number }

export default function InvitePage() {
  const params = useParams()
  const code = String(params.code || '').toUpperCase()
  const [state, setState] = useState<'loading' | 'invalid' | 'visitor' | 'joined' | 'self'>('loading')
  const [preview, setPreview] = useState<Preview | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const p = await fetchInvitePreview(code)
      if (cancelled) return
      if (!p) {
        setState('invalid')
        return
      }
      setPreview(p)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Applied automatically once they have an account (see InviteRedeemer).
        rememberInvite(code)
        setState('visitor')
        return
      }
      const r = await redeemInvite(code)
      if (cancelled) return
      setState(r?.result === 'self' ? 'self' : r?.result === 'friends' ? 'joined' : 'invalid')
    }
    run()
    return () => {
      cancelled = true
    }
  }, [code])

  if (state === 'loading') return null

  if (state === 'invalid' || !preview) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-3xl font-medium">This invite link doesn&apos;t work</h1>
        <p className="mt-3 text-brand-secondary">Check that the whole link was copied, or ask your friend to send it again.</p>
        <Link href="/" className="mt-8 inline-block text-brand-primary hover:underline">
          Go to Orivian
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-20 sm:py-24">
      <div className="flex flex-col items-center text-center">
        <Avatar avatarId={preview.avatar} name={preview.alias} size={88} />
        <p className="mt-4 flex items-center gap-2 text-brand-secondary">
          <span className="text-brand-text">{preview.alias}</span>
          <LevelBadge xp={preview.total_xp} />
        </p>

        {state === 'self' ? (
          <>
            <h1 className="mt-6 text-3xl font-medium">This is your own invite link</h1>
            <p className="mt-3 text-brand-secondary">Send it to friends and they&apos;ll join as your friend.</p>
            <Link href="/friends" className="mt-8 rounded-md bg-brand-primary px-7 py-3 font-medium text-black hover:bg-brand-primary-light">
              Go to Friends
            </Link>
          </>
        ) : state === 'joined' ? (
          <>
            <h1 className="mt-6 text-3xl font-medium">You and {preview.alias} are now friends</h1>
            <p className="mt-3 text-brand-secondary">You can follow each other&apos;s progress on the Friends page.</p>
            <Link href="/friends" className="mt-8 rounded-md bg-brand-primary px-7 py-3 font-medium text-black hover:bg-brand-primary-light">
              See your friends
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-3xl font-medium leading-tight sm:text-4xl">{preview.alias} invited you to learn on Orivian</h1>
            <p className="mt-4 text-brand-secondary">
              Courses and certification prep with lessons, quizzes and practice exams. Create an account and you&apos;ll
              be friends with {preview.alias}, so you can follow each other&apos;s progress. Finish your first lesson and
              you both get {INVITE_XP} XP.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/signup" className="whitespace-nowrap rounded-md bg-brand-primary px-7 py-3 font-medium text-black hover:bg-brand-primary-light">
                Create your account
              </Link>
              <Link href="/login" className="whitespace-nowrap rounded-md border border-brand-muted/40 px-7 py-3 font-medium hover:border-brand-primary">
                I already have an account
              </Link>
            </div>
            <Link href="/courses" className="mt-6 text-sm text-brand-secondary hover:text-brand-primary">
              Look at the courses first
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
