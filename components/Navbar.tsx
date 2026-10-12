'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import NavStreak from '@/components/NavStreak'
import AliasPrompt from '@/components/AliasPrompt'
import Avatar from '@/components/Avatar'
import NavFriends from '@/components/NavFriends'
import NavAdmin from '@/components/NavAdmin'
import InviteRedeemer from '@/components/InviteRedeemer'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // The learner's avatar, refreshed when they change it on their profile.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = () =>
      supabase
        .from('profiles')
        .select('avatar')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!cancelled) setAvatar(data?.avatar ?? null)
        })
    load()
    window.addEventListener('orivian:profile', load)
    return () => {
      cancelled = true
      window.removeEventListener('orivian:profile', load)
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="flex items-center justify-between gap-4 px-6 py-4 border-b border-brand-muted/20">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.svg" alt="Orivian" className="h-8 w-auto" />
        <span className="font-display text-xl font-medium tracking-tight text-brand-primary">Orivian</span>
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-6 text-sm">
        <Link href="/courses" className="hover:text-brand-primary transition">
          Courses
        </Link>
        {user ? (
          <>
            <AliasPrompt userId={user.id} />
            <InviteRedeemer userId={user.id} accountInvite={user.user_metadata?.invite_code} />
            <NavStreak userId={user.id} />
            <Link href="/stats" className="hover:text-brand-primary transition">
              Stats
            </Link>
            <NavFriends />
            <Link href="/notes" className="hover:text-brand-primary transition">
              Notes
            </Link>
            {user.email === 'dan@orivian.io' && <NavAdmin />}
            <Link href="/profile" className="flex items-center gap-2 hover:text-brand-primary transition">
              <Avatar avatarId={avatar} name={user.user_metadata?.full_name || user.email} size={26} />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="text-brand-secondary hover:text-brand-primary transition"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-brand-primary transition">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-brand-primary text-black px-4 py-2 rounded-md font-medium hover:bg-brand-primary-light transition"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
