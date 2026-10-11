'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LiveActivity from '@/components/LiveActivity'

export default function LivePage() {
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Signed-out visitors get the anonymous map on the homepage.
      if (!user) router.replace('/')
      else setReady(true)
    })
  }, [router])

  if (!ready) return null

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <LiveActivity />
    </main>
  )
}
