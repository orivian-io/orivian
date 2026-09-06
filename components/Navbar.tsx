'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/20">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.svg" alt="Orivian" className="h-8 w-auto" />
        <span className="text-xl font-bold tracking-wide text-brand-primary">ORIVIAN</span>
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/courses" className="hover:text-brand-primary transition">
          Courses
        </Link>
        {user ? (
          <Link href="/profile" className="hover:text-brand-primary transition">
            Profile
          </Link>
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