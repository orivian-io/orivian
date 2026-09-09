'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  return (
    <main className="max-w-sm mx-auto py-16 px-4">
      <div className="rounded-xl bg-brand-surface p-8">
        <h1 className="text-2xl font-medium mb-6">Log in</h1>

        <button
          onClick={handleGoogleSignIn}
          className="w-full border border-brand-muted/40 rounded-md p-2 mb-4 flex items-center justify-center gap-2 text-sm hover:border-brand-primary transition"
        >
          Continue with Google
        </button>
        <div className="text-center text-xs text-brand-secondary mb-4">or</div>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface-raised text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface-raised text-sm"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-brand-primary text-black rounded-md p-2 font-medium hover:bg-brand-primary-light transition"
          >
            Log in
          </button>
        </form>
        <p className="text-sm text-brand-secondary mt-4">
          No account? <Link href="/signup" className="text-brand-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  )
}