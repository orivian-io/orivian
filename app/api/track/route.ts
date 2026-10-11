import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedUser } from '@/lib/get-authed-user'

// Records one page view for the admin Traffic report (0018_site_traffic.sql).
// Privacy: the IP address is only used here, inside a one-way hash that also
// includes today's date, so visitors get an anonymous id that changes daily
// and the IP itself is never stored. Location is country / US state only.

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|embedly|whatsapp|curl|wget|python|node-fetch|axios/i

function normalizePath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return null
  let path = raw.split(/[?#]/)[0].slice(0, 200)
  if (path.length > 1) path = path.replace(/\/+$/, '')
  if (path.startsWith('/api') || path.startsWith('/admin') || path.startsWith('/_next')) return null
  // Collapse personal or per-lesson URLs into one page each.
  if (path.startsWith('/invite/')) return '/invite'
  const learn = path.match(/^\/learn\/([^/]+)/)
  if (learn) return `/learn/${learn[1]}`
  return path || '/'
}

function referrerHost(raw: unknown, ownHost: string | null): string | null {
  if (typeof raw !== 'string' || !raw) return null
  try {
    const host = new URL(raw).hostname.toLowerCase()
    if (!host || (ownHost && host === ownHost.toLowerCase().split(':')[0])) return null
    return host.slice(0, 100)
  } catch {
    return null
  }
}

function deviceFrom(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return 'tablet'
  if (/mobi|iphone|ipod|android/i.test(ua)) return 'mobile'
  return 'desktop'
}

export async function POST(req: NextRequest) {
  // Only count the live site, not preview deployments.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return new NextResponse(null, { status: 204 })
  }

  const ua = req.headers.get('user-agent') || ''
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 })

  const body = await req.json().catch(() => null)
  const path = normalizePath(body?.path)
  if (!path) return new NextResponse(null, { status: 204 })

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || ''
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const salt = process.env.TRAFFIC_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const visitor = createHash('sha256').update(`${day}|${ip}|${ua}|${salt}`).digest('hex').slice(0, 24)

  const country = (req.headers.get('x-vercel-ip-country') || '').toUpperCase()
  const region = (req.headers.get('x-vercel-ip-country-region') || '').toUpperCase()
  const validCountry = /^[A-Z]{2}$/.test(country) ? country : null
  const validRegion = validCountry === 'US' && /^[A-Z]{2}$/.test(region) ? region : null

  const landing = body?.landing === true
  const utm = typeof body?.utm === 'string' ? body.utm.trim().toLowerCase().slice(0, 60) || null : null
  const user = req.headers.get('authorization') ? await getAuthedUser(req) : null

  await supabaseAdmin.from('page_views').insert({
    visitor,
    path,
    landing,
    referrer: landing ? referrerHost(body?.referrer, req.headers.get('host')) : null,
    utm_source: landing ? utm : null,
    country: validCountry,
    region: validRegion,
    device: deviceFrom(ua),
    user_id: user?.id ?? null,
  })

  return new NextResponse(null, { status: 204 })
}
