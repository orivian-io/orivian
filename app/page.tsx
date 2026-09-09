'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PeakBackdrop from '@/components/PeakBackdrop'

export default function Home() {
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setChecking(false)
      }
    }
    check()
  }, [router])

  if (checking) return null

  return (
    <main>
      <section className="relative overflow-hidden">
        <PeakBackdrop />
        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-32 text-center">
          <img
            src="/logo.svg"
            alt="Orivian"
            className="h-28 w-auto mx-auto mb-8"
          />

          <span className="inline-block text-xs font-medium text-brand-primary border border-brand-primary/40 rounded-full px-3 py-1 mb-6">
            Beta · Launched September 2026
          </span>

          <h1 className="text-5xl font-medium mb-6 leading-tight">
            <span className="text-brand-primary">Free courses</span>,<br />
            built for professionals.
          </h1>

          <p className="text-lg text-brand-secondary max-w-xl mx-auto mb-10">
            Orivian is a free learning platform for any professional field —
            starting with a full CISSP certification prep course.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/courses"
              className="inline-block bg-brand-primary text-black px-8 py-3 rounded-md font-medium hover:bg-brand-primary-light transition"
            >
              Browse Courses
            </Link>
            <Link
              href="/signup"
              className="inline-block border border-brand-muted/40 px-8 py-3 rounded-md font-medium hover:border-brand-primary transition"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-muted/20">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-medium mb-6">
            Certifications shouldn&apos;t require a toll booth.
          </h2>
          <p className="text-brand-secondary text-lg leading-relaxed mb-6">
            The knowledge behind every major certification — CISSP, Security+, Excel
            mastery, Python, working with AI tools like Claude — already exists,
            scattered across the internet, largely free. What&apos;s missing isn&apos;t
            the information. It&apos;s a place that organizes it, teaches it properly,
            and doesn&apos;t charge you hundreds of dollars for the privilege.
          </p>
          <p className="text-brand-secondary text-lg leading-relaxed mb-6">
            Orivian is that place. A free platform built to train you on exactly what
            a certification or skillset actually requires — no vendor markup, no
            paywall between you and the material.
          </p>
          <p className="text-brand-secondary text-lg leading-relaxed">
            Orivian launched in September 2026 as a beta. We&apos;re actively building
            out training content across certifications and skills. The full
            platform — more courses, more depth — is coming as that material gets
            built out properly. What you&apos;re using today is the beginning, not the
            finished product.
          </p>
        </div>
      </section>

      <section className="border-t border-brand-muted/20">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-medium mb-10 text-center">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="h-10 w-10 rounded-full bg-brand-surface flex items-center justify-center text-brand-primary font-medium mb-4">1</div>
              <h3 className="font-medium mb-2">Pick a path</h3>
              <p className="text-brand-secondary text-sm">
                Browse by category — cybersecurity, IT, and more to come — or search for exactly what you need.
              </p>
            </div>
            <div>
              <div className="h-10 w-10 rounded-full bg-brand-surface flex items-center justify-center text-brand-primary font-medium mb-4">2</div>
              <h3 className="font-medium mb-2">Learn at your pace</h3>
              <p className="text-brand-secondary text-sm">
                Work through lessons whenever it fits your schedule. Your progress is saved automatically.
              </p>
            </div>
            <div>
              <div className="h-10 w-10 rounded-full bg-brand-surface flex items-center justify-center text-brand-primary font-medium mb-4">3</div>
              <h3 className="font-medium mb-2">Get certified</h3>
              <p className="text-brand-secondary text-sm">
                Finish the material with real, practical knowledge — no gatekeeping, no upsell.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}