'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LiveActivity from '@/components/LiveActivity'
import TrafficSection from '@/components/admin/TrafficSection'
import Avatar from '@/components/Avatar'
import { getAvatar } from '@/lib/avatars'
import { timeAgo } from '@/lib/live'
import { fetchAdminOverview, pctOf, type AdminOverview, type Person } from '@/lib/admin'

const ADMIN_EMAIL = 'dan@orivian.io'

type StudyTimeRow = {
  user_id: string
  email: string | null
  full_name: string | null
  course_id: string | null
  course_title: string | null
  current_seconds: number
  archived_seconds: number
  last_studied_at: string | null
}

type CourseRequest = {
  id: string
  requested_title: string
  notes: string | null
  created_at: string
  user_id: string | null
}

const SECTIONS = [
  ['overview', 'Overview'],
  ['traffic', 'Traffic'],
  ['live', 'Live'],
  ['friends', 'Friends & invites'],
  ['features', 'Feature adoption'],
  ['courses', 'Courses'],
  ['learners', 'Learners'],
  ['study-time', 'Study time'],
  ['requests', 'Requests'],
] as const

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h.toLocaleString()}h ${m}m` : `${m}m`
}

function shortDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'
}

function who(p: Person) {
  return p.full_name || p.email || p.alias || 'Unknown'
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div>
      <dt className="text-xs text-brand-secondary">{label}</dt>
      <dd className="mt-1 text-2xl tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</dd>
      {note && <dd className="mt-0.5 text-xs text-brand-muted">{note}</dd>}
    </div>
  )
}

function SectionHeading({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div id={id} className="mb-4 scroll-mt-24">
      <h2 className="text-xl font-medium">{title}</h2>
      {note && <p className="mt-1 text-sm text-brand-secondary">{note}</p>}
    </div>
  )
}

// Single-series daily bar chart (last 30 days) with hover values.
function DailyBars({ title, data, field }: { title: string; data: AdminOverview['daily']; field: 'active' | 'signups' | 'lessons' }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d[field]))
  const total = data.reduce((s, d) => s + d[field], 0)
  const h = hover !== null ? data[hover] : null
  return (
    <figure className="rounded-xl bg-brand-surface p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2 text-sm">
        <span>{title}</span>
        <span className="text-xs text-brand-secondary tabular-nums">
          {h ? `${shortDate(h.day + 'T12:00:00')}: ${h[field]}` : `${total.toLocaleString()} in 30 days`}
        </span>
      </figcaption>
      <div className="flex h-24 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <div
            key={d.day}
            className="flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            title={`${shortDate(d.day + 'T12:00:00')}: ${d[field]}`}
          >
            <div
              className={`w-full rounded-t-[3px] ${hover === i ? 'bg-brand-primary-light' : 'bg-brand-primary/70'}`}
              style={{ height: d[field] > 0 ? `${Math.max(4, (d[field] / max) * 100)}%` : '1px', opacity: d[field] > 0 ? 1 : 0.25 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-brand-muted">
        <span>{shortDate(data[0]?.day + 'T12:00:00')}</span>
        <span>Today</span>
      </div>
    </figure>
  )
}

function Meter({ label, part, whole, detail }: { label: string; part: number; whole: number; detail?: string }) {
  const pct = pctOf(part, whole)
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-brand-secondary tabular-nums">
          {pct}% <span className="text-xs text-brand-muted">({part.toLocaleString()} of {whole.toLocaleString()})</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-brand-muted/20" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${pct}%` }} />
      </div>
      {detail && <p className="mt-1 text-xs text-brand-muted">{detail}</p>}
    </li>
  )
}

const th = 'py-2 pr-4 font-normal'
const td = 'py-2 pr-4'

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [overviewFailed, setOverviewFailed] = useState(false)
  const [requests, setRequests] = useState<CourseRequest[]>([])
  const [studyTime, setStudyTime] = useState<StudyTimeRow[] | null>(null)
  const [learnerQuery, setLearnerQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setAuthorized(true)

      fetchAdminOverview().then((o) => (o ? setOverview(o) : setOverviewFailed(true)))

      supabase
        .from('course_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => setRequests(data || []))

      // Lifetime study time comes from a server route (service role), since
      // it includes time learners have reset from their own timers.
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const res = await fetch('/api/admin/study-time', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch(() => null)
        const json = res?.ok ? await res.json().catch(() => null) : null
        setStudyTime(json?.rows ?? [])
      }
    }
    load()
  }, [router])

  const learners = useMemo(() => {
    const q = learnerQuery.trim().toLowerCase()
    const list = overview?.learner_list ?? []
    if (!q) return list
    return list.filter((l) => [l.full_name, l.email, l.alias].some((v) => v?.toLowerCase().includes(q)))
  }, [overview, learnerQuery])

  if (!authorized) return null

  const o = overview
  const L = o?.learners
  const F = o?.friends
  const I = o?.invites
  const X = o?.features

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium">Admin</h1>
        {o && <p className="text-xs text-brand-muted">Updated {new Date(o.generated_at).toLocaleTimeString()}</p>}
      </header>

      <nav aria-label="Admin sections" className="sticky top-0 z-20 -mx-4 mb-10 overflow-x-auto border-b border-brand-muted/15 bg-brand-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <ul className="flex gap-5 whitespace-nowrap text-sm">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-brand-secondary hover:text-brand-primary">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {overviewFailed && (
        <p className="mb-10 rounded-lg border border-brand-muted/30 p-4 text-sm text-brand-secondary">
          The overview couldn&apos;t load. Has migration 0017 been run in Supabase?
        </p>
      )}

      {/* Overview */}
      <section className="mb-14">
        <SectionHeading id="overview" title="Overview" note="Active means the learner had a study session in that window." />
        {L ? (
          <>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 rounded-xl bg-brand-surface p-6 sm:grid-cols-4">
              <Stat label="Learners" value={L.total} note={`${L.new_7d} new this week, ${L.new_30d} this month`} />
              <Stat label="Active today" value={L.active_1d} note={`${L.active_7d} this week, ${L.active_30d} this month`} />
              <Stat label="Lessons completed" value={L.lessons_completed} note={`${L.lessons_7d} this week`} />
              <Stat label="Time studied" value={formatHours(L.study_seconds)} note="Lifetime, including reset time" />
              <Stat label="Have studied at all" value={`${pctOf(L.ever_studied, L.total)}%`} note={`${L.ever_studied} of ${L.total} learners`} />
              <Stat label="Exam attempts this week" value={L.exam_attempts_7d} />
              <Stat label="XP awarded" value={L.xp_awarded} />
              <Stat label="Courses live" value={o.courses.filter((c) => c.published).length} />
            </dl>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <DailyBars title="Active learners per day" data={o.daily} field="active" />
              <DailyBars title="Signups per day" data={o.daily} field="signups" />
              <DailyBars title="Lessons completed per day" data={o.daily} field="lessons" />
            </div>
          </>
        ) : (
          !overviewFailed && <div className="h-48 animate-pulse rounded-xl bg-brand-surface" />
        )}
      </section>

      <TrafficSection />

      {/* Live */}
      <section className="mb-14">
        <div id="live" className="scroll-mt-24" />
        <LiveActivity variant="admin" />
      </section>

      {/* Friends & invites */}
      {F && I && L && (
        <section className="mb-14">
          <SectionHeading id="friends" title="Friends & invites" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl bg-brand-surface p-6">
              <h3 className="mb-4 font-medium">Friends</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                <Stat label="Friendships" value={F.friendships} />
                <Stat label="Learners with a friend" value={`${pctOf(F.learners_with_friends, L.total)}%`} note={`${F.learners_with_friends} learners`} />
                <Stat label="Average friends" value={F.avg_friends ?? 0} note="Among learners with any" />
                <Stat label="Requests this week" value={F.requests_7d} />
                <Stat
                  label="Requests accepted"
                  value={F.requests_sent > 0 ? `${pctOf(F.requests_accepted, F.requests_sent)}%` : '-'}
                  note={`${F.requests_accepted} of ${F.requests_sent}; declined ones aren't kept`}
                />
                <Stat label="Waiting for an answer" value={F.pending} />
              </dl>
              <p className="mt-4 text-xs text-brand-muted">
                {F.via_invite} friendships came from invite links, {F.requests_accepted} from requests by alias.
              </p>
              {F.most_connected.length > 0 && (
                <>
                  <h4 className="mb-2 mt-6 text-sm text-brand-secondary">Most connected</h4>
                  <table className="w-full text-sm text-brand-text">
                    <tbody>
                      {F.most_connected.map((p, i) => (
                        <tr key={i} className="border-t border-brand-muted/10">
                          <td className={td}>
                            {who(p)}
                            <span className="block text-xs text-brand-muted">{p.alias}</span>
                          </td>
                          <td className="py-2 text-right tabular-nums">{p.friends} friends</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className="rounded-xl bg-brand-surface p-6">
              <h3 className="mb-4 font-medium">Invites</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                <Stat label="Joined by invite" value={I.joined} note={`${I.joined_7d} this week`} />
                <Stat label="Share of signups" value={`${pctOf(I.joined, L.total)}%`} />
                <Stat
                  label="Finished a first lesson"
                  value={I.joined > 0 ? `${pctOf(I.qualified, I.joined)}%` : '-'}
                  note={`${I.qualified} of ${I.joined} invited learners`}
                />
                <Stat label="Learners who invited" value={I.inviters} />
                <Stat label="Invite XP awarded" value={I.xp_awarded} />
              </dl>
              {I.top_inviters.length > 0 && (
                <>
                  <h4 className="mb-2 mt-6 text-sm text-brand-secondary">Top inviters</h4>
                  <table className="w-full text-sm text-brand-text">
                    <thead>
                      <tr className="text-left text-xs text-brand-secondary">
                        <th className={th}>Learner</th>
                        <th className={`${th} text-right`}>Joined</th>
                        <th className="py-2 text-right font-normal">First lesson</th>
                      </tr>
                    </thead>
                    <tbody>
                      {I.top_inviters.map((p, i) => (
                        <tr key={i} className="border-t border-brand-muted/10">
                          <td className={td}>
                            {who(p)}
                            <span className="block text-xs text-brand-muted">{p.alias}</span>
                          </td>
                          <td className={`${td} text-right tabular-nums`}>{p.joined}</td>
                          <td className="py-2 text-right tabular-nums">{p.qualified}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-brand-surface p-6">
            <h3 className="mb-3 font-medium">Recent invite signups</h3>
            {I.recent.length === 0 ? (
              <p className="text-sm text-brand-secondary">No one has joined through an invite yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-brand-text">
                  <thead>
                    <tr className="text-left text-xs text-brand-secondary">
                      <th className={th}>New learner</th>
                      <th className={th}>Invited by</th>
                      <th className={th}>Joined</th>
                      <th className="py-2 font-normal">First lesson</th>
                    </tr>
                  </thead>
                  <tbody>
                    {I.recent.map((r, i) => (
                      <tr key={i} className="border-t border-brand-muted/10">
                        <td className={td}>
                          {who(r)}
                          <span className="block text-xs text-brand-muted">{r.alias}</span>
                        </td>
                        <td className={td}>
                          {r.inviter_name || r.inviter_alias}
                          <span className="block text-xs text-brand-muted">{r.inviter_alias}</span>
                        </td>
                        <td className={`${td} whitespace-nowrap text-brand-secondary`}>{shortDate(r.invited_at)}</td>
                        <td className={`py-2 ${r.qualified ? 'text-brand-primary' : 'text-brand-muted'}`}>
                          {r.qualified ? 'Done, XP awarded' : 'Not yet'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Feature adoption */}
      {X && L && F && (
        <section className="mb-14">
          <SectionHeading id="features" title="Feature adoption" note="Share of all learners using each feature." />
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <ul className="space-y-5 rounded-xl bg-brand-surface p-6">
              <Meter label="Chose their own alias" part={X.alias_confirmed} whole={L.total} detail="Kept or changed the alias from the sign-up prompt." />
              <Meter label="Picked an avatar" part={X.avatar_chosen} whole={L.total} />
              <Meter label="Have at least one friend" part={F.learners_with_friends} whole={L.total} />
              <Meter label="Take notes" part={X.note_takers} whole={L.total} detail={`${X.notes.toLocaleString()} notes saved in total.`} />
              <Meter label="On an active streak" part={X.streak_active} whole={L.total} />
              <Meter label="Hidden from public views" part={X.hidden} whole={L.total} />
              <Meter
                label="Sessions placed on the map (this week)"
                part={X.located_sessions_7d}
                whole={X.sessions_7d}
                detail="Sessions with a known state or country."
              />
            </ul>
            <div className="space-y-5">
              {X.levels && X.levels.length > 0 && (
                <div className="rounded-xl bg-brand-surface p-6">
                  <h3 className="mb-3 font-medium">Learners by level</h3>
                  <ul className="space-y-2">
                    {X.levels.map((b) => (
                      <li key={b.label} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                        <span className="text-brand-secondary">{b.label}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-brand-muted/20">
                          <span className="block h-full rounded-full bg-brand-primary" style={{ width: `${pctOf(b.n, L.total)}%` }} />
                        </span>
                        <span className="text-right tabular-nums">{b.n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {X.top_avatars.length > 0 && (
                <div className="rounded-xl bg-brand-surface p-6">
                  <h3 className="mb-3 font-medium">Most chosen avatars</h3>
                  <ul className="grid grid-cols-4 gap-3">
                    {X.top_avatars.map((a) => (
                      <li key={a.avatar} className="flex flex-col items-center gap-1 text-center">
                        <Avatar avatarId={a.avatar} size={40} />
                        <span className="text-[11px] text-brand-secondary">{getAvatar(a.avatar)?.name ?? a.avatar}</span>
                        <span className="text-xs tabular-nums">{a.n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Courses */}
      {o && (
        <section className="mb-14">
          <SectionHeading id="courses" title="Courses" note="Average progress is across everyone currently enrolled." />
          <div className="overflow-x-auto rounded-xl bg-brand-surface p-2 sm:p-4">
            <table className="w-full text-sm text-brand-text">
              <thead>
                <tr className="border-b border-brand-muted/20 text-left text-xs text-brand-secondary">
                  <th className={th}>Course</th>
                  <th className={`${th} text-right`}>Lessons</th>
                  <th className={`${th} text-right`}>Enrolled</th>
                  <th className={`${th} text-right`}>Active this week</th>
                  <th className={`${th} text-right`}>Lessons this week</th>
                  <th className={`${th} w-40`}>Average progress</th>
                  <th className="py-2 text-right font-normal">Finished</th>
                </tr>
              </thead>
              <tbody>
                {o.courses.map((c) => (
                  <tr key={c.id} className="border-b border-brand-muted/10">
                    <td className={td}>
                      {c.title}
                      {!c.published && <span className="ml-2 rounded bg-brand-muted/20 px-1.5 py-0.5 text-[10px] text-brand-secondary">draft</span>}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{c.lessons}</td>
                    <td className={`${td} text-right tabular-nums`}>{c.enrolled}</td>
                    <td className={`${td} text-right tabular-nums`}>{c.active_7d}</td>
                    <td className={`${td} text-right tabular-nums`}>{c.lessons_7d}</td>
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-muted/20">
                          <span className="block h-full rounded-full bg-brand-primary" style={{ width: `${c.avg_progress ?? 0}%` }} />
                        </span>
                        <span className="w-9 text-right text-xs tabular-nums text-brand-secondary">{c.avg_progress ?? 0}%</span>
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{c.finished}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Learners */}
      {o && (
        <section className="mb-14">
          <SectionHeading id="learners" title="Learners" note="The 100 most recently active, newest sign-ups included." />
          <input
            type="search"
            value={learnerQuery}
            onChange={(e) => setLearnerQuery(e.target.value)}
            placeholder="Filter by name, email or alias"
            className="mb-3 w-full max-w-sm rounded-md border border-brand-muted/40 bg-brand-surface px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
          />
          <div className="overflow-x-auto rounded-xl bg-brand-surface p-2 sm:p-4">
            <table className="w-full text-sm text-brand-text">
              <thead>
                <tr className="border-b border-brand-muted/20 text-left text-xs text-brand-secondary">
                  <th className={th}>Learner</th>
                  <th className={th}>Alias</th>
                  <th className={`${th} text-right`}>Level</th>
                  <th className={`${th} text-right`}>Courses</th>
                  <th className={`${th} text-right`}>Lessons</th>
                  <th className={`${th} text-right`}>Friends</th>
                  <th className={th}>Invited by</th>
                  <th className={th}>Joined</th>
                  <th className="py-2 text-right font-normal">Last active</th>
                </tr>
              </thead>
              <tbody>
                {learners.map((l, i) => (
                  <tr key={`${l.email}-${i}`} className="border-b border-brand-muted/10">
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <Avatar avatarId={l.avatar} name={l.full_name || l.alias} size={24} />
                        <span>
                          {l.full_name || 'No name'}
                          <span className="block text-xs text-brand-muted">{l.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className={td}>
                      {l.alias || '-'}
                      {!l.public && <span className="ml-2 rounded bg-brand-muted/20 px-1.5 py-0.5 text-[10px] text-brand-secondary">hidden</span>}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{l.level}</td>
                    <td className={`${td} text-right tabular-nums`}>{l.courses}</td>
                    <td className={`${td} text-right tabular-nums`}>{l.lessons}</td>
                    <td className={`${td} text-right tabular-nums`}>{l.friends}</td>
                    <td className={`${td} text-brand-secondary`}>{l.invited_by || '-'}</td>
                    <td className={`${td} whitespace-nowrap text-brand-secondary`}>{shortDate(l.created_at)}</td>
                    <td className="whitespace-nowrap py-2 text-right text-brand-secondary">{l.last_seen ? timeAgo(l.last_seen) : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Study time */}
      <section className="mb-14">
        <SectionHeading
          id="study-time"
          title="Study time by learner"
          note='Lifetime engaged time per course. "Reset" is time a learner cleared from their own timer, which still counts here.'
        />
        {studyTime === null ? (
          <p className="text-sm text-brand-secondary">Loading…</p>
        ) : studyTime.length === 0 ? (
          <p className="text-sm text-brand-secondary">No study time recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-brand-surface p-2 sm:p-4">
            <table className="w-full text-sm text-brand-text">
              <thead>
                <tr className="border-b border-brand-muted/20 text-left text-xs text-brand-secondary">
                  <th className={th}>Learner</th>
                  <th className={th}>Course</th>
                  <th className={`${th} text-right`}>Lifetime</th>
                  <th className={`${th} text-right`}>Reset</th>
                  <th className="py-2 text-right font-normal">Last studied</th>
                </tr>
              </thead>
              <tbody>
                {studyTime.map((r) => (
                  <tr key={`${r.user_id}-${r.course_id}`} className="border-b border-brand-muted/10">
                    <td className={td}>{r.full_name || r.email || 'Unknown'}</td>
                    <td className={`${td} text-brand-secondary`}>{r.course_title || '-'}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatHours(r.current_seconds + r.archived_seconds)}</td>
                    <td className={`${td} text-right tabular-nums text-brand-secondary`}>
                      {r.archived_seconds > 0 ? formatHours(r.archived_seconds) : '-'}
                    </td>
                    <td className="whitespace-nowrap py-2 text-right text-brand-secondary">{shortDate(r.last_studied_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Course requests */}
      <section>
        <SectionHeading id="requests" title={`Course requests${requests.length ? ` (${requests.length})` : ''}`} />
        {requests.length === 0 ? (
          <p className="text-sm text-brand-secondary">No requests yet.</p>
        ) : (
          <ul className="divide-y divide-brand-muted/10 rounded-xl bg-brand-surface">
            {requests.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium">{r.requested_title}</p>
                  <span className="whitespace-nowrap text-xs text-brand-secondary">{shortDate(r.created_at)}</span>
                </div>
                {r.notes && <p className="mt-1 text-sm text-brand-secondary">{r.notes}</p>}
                <p className="mt-1 text-xs text-brand-muted">{r.user_id ? 'From a signed-in learner' : 'Anonymous'}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
