'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return null

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.user_metadata?.full_name || user?.email}
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm underline text-gray-600"
        >
          Log out
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Your Courses</h2>
      <a
        href="/courses/cissp"
        className="block border rounded-lg p-6 hover:border-gray-400 transition"
      >
        <h3 className="font-medium">CISSP Certification Prep</h3>
        <p className="text-gray-600 text-sm mt-1">Continue where you left off</p>
      </a>
    </main>
  )
}