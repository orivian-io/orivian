'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
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

  if (success) {
    return (
      <main className="max-w-sm mx-auto py-16 px-4">
        <div className="rounded-xl bg-brand-surface p-8">
          <h1 className="text-2xl font-medium mb-4">Check your email</h1>
          <p className="text-brand-secondary text-sm">
            We sent a confirmation link to {email}. Click it to activate your account.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-sm mx-auto py-16 px-4">
      <div className="rounded-xl bg-brand-surface p-8">
        <h1 className="text-2xl font-medium mb-6">Sign up</h1>

        <button
          onClick={handleGoogleSignIn}
          className="w-full border border-brand-muted/40 rounded-md p-2 mb-4 flex items-center justify-center gap-2 text-sm hover:border-brand-primary transition"
        >
          Continue with Google
        </button>
        <div className="text-center text-xs text-brand-secondary mb-4">or</div>

        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface-raised text-sm"
            required
          />
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
            Sign up
          </button>
        </form>
        <p className="text-sm text-brand-secondary mt-4">
          Already have an account? <Link href="/login" className="text-brand-primary hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  )
}