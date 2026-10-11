'use client'

// Friends and invites (see 0016_friends_and_invites.sql).

import { supabase } from '@/lib/supabase'

export type FriendCourse = { title: string; slug: string; total: number; completed: number; last_active: string | null }

export type Friend = {
  friendship_id: string | null // null for your own row
  is_you: boolean
  alias: string
  avatar: string | null
  total_xp: number
  xp_week: number
  lessons_week: number
  streak: number
  last_seen: string | null
  active_now: boolean
  current_course: string | null
  courses: FriendCourse[]
}

export type FriendEvent = {
  occurred_at: string
  kind: 'lesson_completed' | 'exam_attempt' | 'referral_bonus'
  attempt_type: string | null
  alias: string
  avatar: string | null
  item: string | null
  course: string | null
  course_slug: string | null
  invited_alias: string | null
}

export type FriendRequest = { id: string; alias: string; avatar: string | null; total_xp?: number; created_at: string }

export type FriendsData = {
  generated_at: string
  friends: Friend[]
  feed: FriendEvent[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  invite: { code: string | null; joined: number; qualified: number }
}

export type FriendsSummary = { pending: number; friends: number; invite_code: string | null; joined: number; qualified: number }

export const INVITE_XP = 100
export const INVITE_STORAGE_KEY = 'orivian_invite'

// Invite rewards, in order. Keep in sync with lib/avatars.tsx and 0016.
export const INVITE_MILESTONES = [
  { friends: 1, avatar: 'handshake' },
  { friends: 3, avatar: 'constellation' },
  { friends: 10, avatar: 'flock' },
] as const

const FRIENDS_CHANGED = 'orivian:friends-changed'

export function notifyFriendsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(FRIENDS_CHANGED))
}

export function onFriendsChanged(fn: () => void) {
  window.addEventListener(FRIENDS_CHANGED, fn)
  return () => window.removeEventListener(FRIENDS_CHANGED, fn)
}

export async function fetchFriends(): Promise<FriendsData | null> {
  const { data, error } = await supabase.rpc('my_friends')
  if (error || !data) return null
  return data as FriendsData
}

export async function fetchFriendsSummary(): Promise<FriendsSummary | null> {
  const { data, error } = await supabase.rpc('friends_summary')
  if (error || !data) return null
  return data as FriendsSummary
}

export type SendResult =
  | 'sent'
  | 'accepted'
  | 'already_friends'
  | 'already_sent'
  | 'not_found'
  | 'self'
  | 'too_many_pending'
  | 'error'

export async function sendFriendRequest(alias: string): Promise<{ result: SendResult; alias?: string }> {
  const { data, error } = await supabase.rpc('send_friend_request', { p_alias: alias })
  if (error || !data) return { result: 'error' }
  notifyFriendsChanged()
  return data as { result: SendResult; alias?: string }
}

export async function respondToRequest(id: string, accept: boolean) {
  const { error } = await supabase.rpc('respond_friend_request', { p_request: id, p_accept: accept })
  notifyFriendsChanged()
  return !error
}

export async function removeFriendship(id: string) {
  const { error } = await supabase.rpc('remove_friendship', { p_friendship: id })
  notifyFriendsChanged()
  return !error
}

export async function redeemInvite(code: string) {
  const { data, error } = await supabase.rpc('redeem_invite', { p_code: code })
  if (error || !data) return null
  notifyFriendsChanged()
  return data as { result: 'friends' | 'invalid' | 'self'; alias?: string; credited?: boolean }
}

export async function fetchInvitePreview(code: string) {
  const { data, error } = await supabase.rpc('invite_preview', { p_code: code })
  if (error || !data) return null
  return data as { alias: string; avatar: string | null; total_xp: number }
}

export function inviteLink(code: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://orivian.io'
  return `${origin}/invite/${code}`
}

export function inviteMessage(code: string) {
  return `I'm learning on Orivian. Join me so we can follow each other's progress: ${inviteLink(code)}`
}

// Remember an invite code until the visitor has an account (survives the
// sign-up and email-confirmation round trip in the same browser).
export function rememberInvite(code: string) {
  try {
    localStorage.setItem(INVITE_STORAGE_KEY, code)
  } catch {
    /* storage unavailable: the invite just won't auto-apply */
  }
}

export function peekRememberedInvite(): string | null {
  try {
    return localStorage.getItem(INVITE_STORAGE_KEY)
  } catch {
    return null
  }
}

export function takeRememberedInvite(): string | null {
  try {
    const code = localStorage.getItem(INVITE_STORAGE_KEY)
    if (code) localStorage.removeItem(INVITE_STORAGE_KEY)
    return code
  } catch {
    return null
  }
}

export function sendResultMessage(r: { result: SendResult; alias?: string }) {
  switch (r.result) {
    case 'sent':
      return `Request sent to ${r.alias}.`
    case 'accepted':
      return `${r.alias} had already asked. You're now friends.`
    case 'already_friends':
      return `You're already friends with ${r.alias}.`
    case 'already_sent':
      return `You've already sent ${r.alias} a request.`
    case 'not_found':
      return "No learner has that alias. Check the spelling, or send them your invite link instead."
    case 'self':
      return "That's your own alias."
    case 'too_many_pending':
      return 'You have 50 requests waiting for an answer. Cancel some before sending more.'
    default:
      return "Couldn't send the request. Try again."
  }
}
