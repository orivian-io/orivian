'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import LevelBadge from '@/components/LevelBadge'
import Avatar from '@/components/Avatar'
import AvatarPicker from '@/components/AvatarPicker'
import CourseMenu from '@/components/CourseMenu'
import RemoveCourseDialog from '@/components/RemoveCourseDialog'
import ResetProgressDialog from '@/components/ResetProgressDialog'
import { fetchMyStats, notifyProfileChanged, STREAK_TIERS, type MyStats } from '@/lib/stats'
import { levelFor } from '@/lib/levels'
import { AVATARS, isAvatarUnlocked, nextAvatarUnlock } from '@/lib/avatars'
import { fetchFriendsSummary, type FriendsSummary } from '@/lib/friends'
import { aliasSaveError, generateAlias, validateAlias } from '@/lib/alias'
import { loadHome, type HomeCourse } from '@/lib/home'
import { placeName } from '@/lib/live'

type ProfileFields = {
  job_title: string
  company: string
  bio: string
  linkedin_url: string
}

type CourseTime = { totalSeconds: number; todaySeconds: number }

function formatStudyTime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0 && minutes === 0) return '0m'
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

const inputClass =
  'w-full rounded-md border border-brand-muted/40 bg-brand-surface-raised p-2 text-sm focus:border-brand-primary focus:outline-none'

const quietButton =
  'shrink-0 whitespace-nowrap rounded-md border border-brand-muted/40 px-3 py-1.5 text-sm text-brand-secondary transition hover:border-brand-primary/50 hover:text-brand-primary'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // About you (private details)
  const [fields, setFields] = useState<ProfileFields>({ job_title: '', company: '', bio: '', linkedin_url: '' })
  const [draft, setDraft] = useState<ProfileFields>(fields)
  const [editingAbout, setEditingAbout] = useState(false)
  const [savingAbout, setSavingAbout] = useState(false)

  // Public identity
  const [alias, setAlias] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [aliasDraft, setAliasDraft] = useState('')
  const [publicDraft, setPublicDraft] = useState(true)
  const [editingPublic, setEditingPublic] = useState(false)
  const [savingPublic, setSavingPublic] = useState(false)
  const [aliasError, setAliasError] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mapPlace, setMapPlace] = useState<string | null>(null)

  // Learning
  const [stats, setStats] = useState<MyStats | null>(null)
  const [courses, setCourses] = useState<HomeCourse[]>([])
  const [courseTimes, setCourseTimes] = useState<Record<string, CourseTime>>({})
  const [studySeconds, setStudySeconds] = useState(0)
  const [studySecondsToday, setStudySecondsToday] = useState(0)
  const [noteCount, setNoteCount] = useState(0)
  const [friendsInfo, setFriendsInfo] = useState<FriendsSummary | null>(null)
  const [target, setTarget] = useState<{ course: HomeCourse; action: 'reset' | 'remove' } | null>(null)

  const loadCourses = useCallback(async (userId: string) => {
    const home = await loadHome(userId)
    setCourses(home.enrolled)
    const times = await Promise.all(
      home.enrolled.map(async (c) => {
        const { data } = await supabase.rpc('course_study_breakdown', { p_user_id: userId, p_course_id: c.id })
        const row = Array.isArray(data) ? data[0] : data
        return [c.id, { totalSeconds: row?.total_seconds || 0, todaySeconds: row?.today_seconds || 0 }] as const
      }),
    )
    setCourseTimes(Object.fromEntries(times))
    const [{ data: total }, { data: today }] = await Promise.all([
      supabase.rpc('total_study_seconds', { p_user_id: userId }),
      supabase.rpc('total_study_seconds_today', { p_user_id: userId }),
    ])
    setStudySeconds(total || 0)
    setStudySecondsToday(today || 0)
    fetchMyStats().then((s) => s && setStats(s))
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const [{ data: aboutRow }, { data: publicRow }, { count: notes }, { data: lastPlace }] = await Promise.all([
        supabase.from('profiles').select('job_title, company, bio, linkedin_url').eq('id', user.id).single(),
        supabase.from('profiles').select('display_name, show_on_leaderboards, avatar').eq('id', user.id).single(),
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase
          .from('study_sessions')
          .select('country, region')
          .eq('user_id', user.id)
          .not('country', 'is', null)
          .order('last_heartbeat_at', { ascending: false })
          .limit(1),
      ])

      if (aboutRow) {
        const f = {
          job_title: aboutRow.job_title || '',
          company: aboutRow.company || '',
          bio: aboutRow.bio || '',
          linkedin_url: aboutRow.linkedin_url || '',
        }
        setFields(f)
        setDraft(f)
      }
      if (publicRow) {
        setAlias(publicRow.display_name || '')
        setIsPublic(publicRow.show_on_leaderboards !== false)
        setAvatar(publicRow.avatar ?? null)
      }
      setNoteCount(notes || 0)
      fetchFriendsSummary().then(setFriendsInfo)
      const place = lastPlace?.[0]
      if (place?.country) setMapPlace(place.country === 'US' && place.region ? `US-${place.region}` : place.country)

      // Opened from a level-up message: show the avatar picker straight away.
      if (new URLSearchParams(window.location.search).get('avatars')) setPickerOpen(true)

      await loadCourses(user.id)
      setLoading(false)
    }
    load()
  }, [router, loadCourses])

  const saveAbout = async () => {
    if (!user) return
    setSavingAbout(true)
    await supabase
      .from('profiles')
      .update({
        job_title: draft.job_title || null,
        company: draft.company || null,
        bio: draft.bio || null,
        linkedin_url: draft.linkedin_url || null,
      })
      .eq('id', user.id)
    setSavingAbout(false)
    setFields(draft)
    setEditingAbout(false)
  }

  const savePublic = async () => {
    if (!user) return
    const problem = validateAlias(aliasDraft)
    if (problem) {
      setAliasError(problem)
      return
    }
    setSavingPublic(true)
    setAliasError('')
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: aliasDraft.trim(), alias_confirmed: true, show_on_leaderboards: publicDraft })
      .eq('id', user.id)
    setSavingPublic(false)
    if (error) {
      setAliasError(aliasSaveError(error))
      return
    }
    setAlias(aliasDraft.trim())
    setIsPublic(publicDraft)
    setEditingPublic(false)
    notifyProfileChanged()
  }

  if (loading || !user) return null

  const fullName = user.user_metadata?.full_name || user.email || ''
  const xp = stats?.xp.total ?? 0
  const level = levelFor(xp).level
  const invites = friendsInfo?.joined ?? 0
  const unlocked = AVATARS.filter((a) => isAvatarUnlocked(a, level, invites)).length
  const nextAvatar = nextAvatarUnlock(level)
  const inProgress = courses.filter((c) => c.completed < c.total || c.total === 0)
  const completed = courses.filter((c) => c.total > 0 && c.completed === c.total)
  const longest = stats?.streak.longest ?? 0
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null
  const refresh = () => {
    setTarget(null)
    loadCourses(user.id)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <AvatarPicker
        open={pickerOpen}
        current={avatar}
        level={level}
        invites={invites}
        name={fullName}
        onClose={() => setPickerOpen(false)}
        onSelect={async (id) => {
          const { error } = await supabase.from('profiles').update({ avatar: id }).eq('id', user.id)
          if (error) throw error
          setAvatar(id)
          notifyProfileChanged()
        }}
      />
      <RemoveCourseDialog
        course={target?.action === 'remove' ? { id: target.course.id, title: target.course.title } : null}
        onClose={() => setTarget(null)}
        onDone={refresh}
      />
      {target?.action === 'reset' && (
        <ResetProgressDialog
          open
          scope="course"
          targetId={target.course.id}
          targetTitle={target.course.title}
          onClose={() => setTarget(null)}
          onDone={refresh}
        />
      )}

      {/* Who you are */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="group relative shrink-0 self-start rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Change avatar"
          title="Change avatar"
        >
          <Avatar avatarId={avatar} name={fullName} size={88} />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-brand-muted/40 bg-brand-surface-raised text-xs text-brand-secondary group-hover:text-brand-primary">
            ✎
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-medium sm:text-4xl">{fullName}</h1>
              <p className="mt-1 text-sm text-brand-secondary">
                {user.email}
                {memberSince ? `, member since ${memberSince}` : ''}
              </p>
            </div>
            {!editingAbout && (
              <button type="button" onClick={() => setEditingAbout(true)} className={quietButton}>
                {fields.job_title || fields.company || fields.bio || fields.linkedin_url ? 'Edit details' : 'Add details'}
              </button>
            )}
          </div>

          {editingAbout ? (
            <div className="mt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Job title (optional)"
                  value={draft.job_title}
                  onChange={(e) => setDraft({ ...draft, job_title: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Company (optional)"
                  value={draft.company}
                  onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                  className={inputClass}
                />
              </div>
              <input
                type="url"
                placeholder="LinkedIn URL (optional)"
                value={draft.linkedin_url}
                onChange={(e) => setDraft({ ...draft, linkedin_url: e.target.value })}
                className={inputClass}
              />
              <textarea
                placeholder="Short bio (optional)"
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                rows={3}
                className={inputClass}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveAbout}
                  disabled={savingAbout}
                  className="rounded-md bg-brand-primary px-5 py-2 text-sm font-medium text-black transition hover:bg-brand-primary-light disabled:opacity-50"
                >
                  {savingAbout ? 'Saving…' : 'Save details'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(fields)
                    setEditingAbout(false)
                  }}
                  className="text-sm text-brand-secondary transition hover:text-brand-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            (fields.job_title || fields.company || fields.bio || fields.linkedin_url) && (
              <div className="mt-4 space-y-1.5 text-sm">
                {(fields.job_title || fields.company) && (
                  <p>
                    {fields.job_title}
                    {fields.job_title && fields.company ? ' at ' : ''}
                    {fields.company}
                  </p>
                )}
                {fields.bio && <p className="max-w-prose text-brand-secondary">{fields.bio}</p>}
                {fields.linkedin_url && (
                  <a
                    href={fields.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-brand-primary hover:underline"
                  >
                    LinkedIn profile
                  </a>
                )}
              </div>
            )
          )}
        </div>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {/* How other learners see you */}
        <section className="rounded-xl bg-brand-surface p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-lg font-medium">How others see you</h2>
            {!editingPublic && (
              <button
                type="button"
                onClick={() => {
                  setAliasDraft(alias)
                  setPublicDraft(isPublic)
                  setAliasError('')
                  setEditingPublic(true)
                }}
                className={quietButton}
              >
                Change
              </button>
            )}
          </div>

          {editingPublic ? (
            <div className="space-y-3">
              <label className="block text-sm text-brand-secondary" htmlFor="alias-input">
                Public alias
              </label>
              <div className="flex gap-2">
                <input
                  id="alias-input"
                  type="text"
                  maxLength={24}
                  value={aliasDraft}
                  onChange={(e) => {
                    setAliasDraft(e.target.value)
                    setAliasError('')
                  }}
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setAliasDraft(generateAlias())
                    setAliasError('')
                  }}
                  className="shrink-0 rounded-md border border-brand-muted/40 px-3 text-sm text-brand-secondary transition hover:text-brand-primary"
                  title="Suggest another alias"
                >
                  🎲 Shuffle
                </button>
              </div>
              {aliasError && <p className="text-xs text-red-400">{aliasError}</p>}
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={publicDraft}
                  onChange={(e) => setPublicDraft(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#C19955]"
                />
                <span>Show my alias on leaderboards and live activity</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={savePublic}
                  disabled={savingPublic}
                  className="rounded-md bg-brand-primary px-5 py-2 text-sm font-medium text-black transition hover:bg-brand-primary-light disabled:opacity-50"
                >
                  {savingPublic ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPublic(false)}
                  className="text-sm text-brand-secondary transition hover:text-brand-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-lg bg-brand-surface-raised px-4 py-3">
                <Avatar avatarId={avatar} name={alias} size={36} />
                <span className="min-w-0 truncate">{alias || 'No alias yet'}</span>
                <LevelBadge xp={xp} />
                <span
                  className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    isPublic ? 'bg-brand-primary/15 text-brand-primary' : 'bg-brand-muted/20 text-brand-secondary'
                  }`}
                >
                  {isPublic ? 'Public' : 'Hidden'}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-brand-secondary">
                {isPublic
                  ? 'This is how you appear on leaderboards and in live activity. Your real name is never shown.'
                  : "You're hidden from leaderboards and live activity. You're still counted, just never named."}
              </p>
              <p className="mt-3 text-sm text-brand-secondary">
                {mapPlace ? (
                  <>
                    On the live map as <span className="text-brand-text">{placeName(mapPlace)}</span>. Only your state
                    or country is ever stored.
                  </>
                ) : (
                  'You’ll appear on the live map, by state or country only, after your next lesson.'
                )}
              </p>
            </>
          )}
        </section>

        {/* Level and avatars */}
        <section className="rounded-xl bg-brand-surface p-6">
          <h2 className="mb-4 text-lg font-medium">Level</h2>
          <LevelBadge xp={xp} variant="card" />
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-brand-muted/15 pt-4">
            <p className="text-sm text-brand-secondary">
              <span className="text-brand-text">{unlocked}</span> of {AVATARS.length} avatars unlocked
              {nextAvatar ? `. Next at level ${nextAvatar.unlockLevel}.` : '.'}
            </p>
            <button type="button" onClick={() => setPickerOpen(true)} className={quietButton}>
              Choose avatar
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-muted/15 pt-4">
            <p className="text-sm text-brand-secondary">
              <span className="text-brand-text">{friendsInfo?.friends ?? 0}</span>{' '}
              {friendsInfo?.friends === 1 ? 'friend' : 'friends'}
              {friendsInfo && friendsInfo.pending > 0 ? `, ${friendsInfo.pending} waiting for you` : ''}
            </p>
            <Link href="/friends" className={quietButton}>
              Invite friends
            </Link>
          </div>
        </section>
      </div>

      {/* Streak, badges and totals */}
      <section className="mt-5 rounded-xl bg-brand-surface p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium">Your study record</h2>
          <Link href="/stats" className="text-sm text-brand-secondary hover:text-brand-primary">
            Accuracy, strengths and leaderboards
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-brand-secondary">Current streak</dt>
            <dd className="mt-1 text-2xl tabular-nums">
              {stats?.streak.current ?? 0} <span className="text-sm text-brand-secondary">days</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-brand-secondary">Longest streak</dt>
            <dd className="mt-1 text-2xl tabular-nums">
              {longest} <span className="text-sm text-brand-secondary">days</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-brand-secondary">Time studied</dt>
            <dd className="mt-1 text-2xl tabular-nums">{formatStudyTime(studySeconds)}</dd>
            {studySecondsToday > 0 && (
              <dd className="text-xs text-brand-secondary">{formatStudyTime(studySecondsToday)} today</dd>
            )}
          </div>
          <div>
            <dt className="text-xs text-brand-secondary">Lessons completed</dt>
            <dd className="mt-1 text-2xl tabular-nums">{stats?.lessons_completed ?? 0}</dd>
            <dd className="text-xs">
              <Link href="/notes" className="text-brand-secondary hover:text-brand-primary">
                {noteCount} {noteCount === 1 ? 'note' : 'notes'} saved
              </Link>
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-brand-muted/15 pt-5">
          <p className="mb-3 text-sm text-brand-secondary">Streak badges</p>
          <ul className="flex flex-wrap gap-2">
            {STREAK_TIERS.map((t) => {
              const earned = longest >= t.days
              return (
                <li
                  key={t.days}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    earned ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-text' : 'border-brand-muted/20 text-brand-muted'
                  }`}
                  title={earned ? `Unlocked with a ${t.days}-day streak` : `Reach a ${t.days}-day streak to unlock`}
                >
                  <span className={earned ? '' : 'opacity-30 grayscale'} aria-hidden="true">
                    {t.emoji}
                  </span>
                  {t.name}
                  <span className="sr-only">{earned ? '(unlocked)' : '(locked)'}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Courses, with manage actions */}
      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-medium">Your courses</h2>
          <Link href="/courses" className="text-sm text-brand-secondary hover:text-brand-primary">
            Find another course
          </Link>
        </div>

        {courses.length === 0 ? (
          <p className="rounded-xl bg-brand-surface p-6 text-sm text-brand-secondary">
            You&apos;re not enrolled in any courses.{' '}
            <Link href="/courses" className="text-brand-primary hover:underline">
              Browse courses
            </Link>{' '}
            to start one.
          </p>
        ) : (
          <ul className="divide-y divide-brand-muted/15 rounded-xl bg-brand-surface">
            {[...inProgress, ...completed].map((c) => {
              const percent = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
              const time = courseTimes[c.id]
              const isDone = c.total > 0 && c.completed === c.total
              return (
                <li key={c.id} className="flex items-start gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <Link href={`/courses/${c.slug}`} className="font-display text-lg hover:text-brand-primary">
                        {c.title}
                      </Link>
                      {isDone && <span className="text-sm text-brand-success">✓ Completed</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-muted/20"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        aria-label={`${c.title} progress`}
                      >
                        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs text-brand-muted tabular-nums">{percent}%</span>
                    </div>
                    <p className="mt-2 text-xs text-brand-secondary">
                      {c.completed} of {c.total} lessons
                      {time && time.totalSeconds > 0 ? `, ${formatStudyTime(time.totalSeconds)} studied` : ''}
                      {time && time.todaySeconds > 0 ? ` (${formatStudyTime(time.todaySeconds)} today)` : ''}
                    </p>
                  </div>
                  <CourseMenu
                    slug={c.slug}
                    title={c.title}
                    onReset={() => setTarget({ course: c, action: 'reset' })}
                    onRemove={() => setTarget({ course: c, action: 'remove' })}
                  />
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-brand-muted">
          Removing a course takes it off your home page and profile. Your progress is kept unless you choose to clear it.
        </p>
      </section>
    </main>
  )
}
