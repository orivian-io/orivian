-- 0016: Friends and invites.
--
-- Friends are mutual: one learner sends a request, the other accepts.
-- People find each other by an exact public alias (only learners who show
-- publicly can be found that way) or through a personal invite link. Real
-- names and emails are never searchable or shown to friends.
--
-- Invite rewards:
--   * Signing up through someone's link makes you friends straight away.
--   * When the new learner finishes their first lesson, both get 100 XP
--     (the inviter's bonus is capped at 25 friends).
--   * Invite-only avatars unlock at 1, 3 and 10 friends who joined.
--
-- Requires 0010-0014. Safe to re-run.

-- ============================================================
-- 1. Invite codes and who invited whom
-- ============================================================

alter table profiles add column if not exists invite_code text;
alter table profiles add column if not exists invited_by uuid references auth.users(id) on delete set null;
alter table profiles add column if not exists invited_at timestamptz;

create or replace function generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  -- No 0/O, 1/I/L, so codes are easy to read aloud and type.
  v_chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    exit when not exists (select 1 from profiles where invite_code = v_code);
  end loop;
  return v_code;
end;
$$;

do $$
declare r record;
begin
  for r in select id from profiles where invite_code is null loop
    update profiles set invite_code = generate_invite_code() where id = r.id;
  end loop;
end $$;

create unique index if not exists profiles_invite_code_idx on profiles (invite_code);
create index if not exists profiles_invited_by_idx on profiles (invited_by);

-- New profiles get a code; learners can't edit their code or who invited them.
create or replace function protect_profile_invites()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.invite_code is null then
      new.invite_code := generate_invite_code();
    end if;
    if current_user in ('anon', 'authenticated') then
      new.invited_by := null;
      new.invited_at := null;
    end if;
    return new;
  end if;

  if current_user in ('anon', 'authenticated') and (
    new.invite_code is distinct from old.invite_code
    or new.invited_by is distinct from old.invited_by
    or new.invited_at is distinct from old.invited_at
  ) then
    raise exception 'Invite details can''t be changed directly';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_invites on profiles;
create trigger protect_profile_invites
  before insert or update on profiles
  for each row execute function protect_profile_invites();

-- ============================================================
-- 2. Friendships
-- ============================================================

create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  source text not null default 'request' check (source in ('request', 'invite')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  check (requester <> addressee)
);

create unique index if not exists friendships_pair_idx
  on friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_requester_idx on friendships (requester);
create index if not exists friendships_addressee_idx on friendships (addressee);

alter table friendships enable row level security;

drop policy if exists "see your own friendships" on friendships;
create policy "see your own friendships"
  on friendships for select
  using (auth.uid() in (requester, addressee));
-- No insert/update/delete policies: changes go through the functions below.

-- Ids of a learner's accepted friends.
create or replace function friend_ids(p_user uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select case when requester = p_user then addressee else requester end
  from friendships
  where status = 'accepted' and p_user in (requester, addressee);
$$;

revoke all on function friend_ids(uuid) from public, anon, authenticated;

-- Send a request by exact alias (case-insensitive). If they already asked
-- you, this accepts their request instead.
create or replace function send_friend_request(p_alias text)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_target uuid;
  v_alias text;
  v_row friendships%rowtype;
begin
  if v_me is null then
    raise exception 'Not signed in';
  end if;

  select id, display_name into v_target, v_alias
  from profiles
  where lower(display_name) = lower(btrim(coalesce(p_alias, ''))) and show_on_leaderboards;

  if v_target is null then
    return json_build_object('result', 'not_found');
  end if;
  if v_target = v_me then
    return json_build_object('result', 'self');
  end if;

  select * into v_row from friendships
  where least(requester, addressee) = least(v_me, v_target)
    and greatest(requester, addressee) = greatest(v_me, v_target);

  if found then
    if v_row.status = 'accepted' then
      return json_build_object('result', 'already_friends', 'alias', v_alias);
    elsif v_row.requester = v_me then
      return json_build_object('result', 'already_sent', 'alias', v_alias);
    else
      update friendships set status = 'accepted', accepted_at = now() where id = v_row.id;
      return json_build_object('result', 'accepted', 'alias', v_alias);
    end if;
  end if;

  if (select count(*) from friendships where requester = v_me and status = 'pending') >= 50 then
    return json_build_object('result', 'too_many_pending');
  end if;

  insert into friendships (requester, addressee) values (v_me, v_target);
  return json_build_object('result', 'sent', 'alias', v_alias);
end;
$$;

create or replace function respond_friend_request(p_request uuid, p_accept boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if p_accept then
    update friendships set status = 'accepted', accepted_at = now()
    where id = p_request and addressee = auth.uid() and status = 'pending';
  else
    delete from friendships where id = p_request and addressee = auth.uid() and status = 'pending';
  end if;
end;
$$;

-- Unfriend, or cancel a request you sent. Works by friendship id.
create or replace function remove_friendship(p_friendship uuid)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  delete from friendships where id = p_friendship and auth.uid() in (requester, addressee);
$$;

-- ============================================================
-- 3. Invite links
-- ============================================================

-- What the invite landing page shows (anyone can call this).
create or replace function invite_preview(p_code text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'alias', coalesce(nullif(btrim(p.display_name), ''), 'An Orivian learner'),
    'avatar', p.avatar,
    'total_xp', (select coalesce(sum(xp), 0) from learning_events e where e.user_id = p.id)
  )
  from profiles p
  where p.invite_code = upper(btrim(coalesce(p_code, '')));
$$;

-- Called after signing in with an invite code: makes you friends with the
-- inviter. For accounts created in the last 7 days it also records who
-- invited you, which is what the XP bonus and invite avatars count.
create or replace function redeem_invite(p_code text)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_inviter uuid;
  v_alias text;
  v_credited boolean := false;
begin
  if v_me is null then
    raise exception 'Not signed in';
  end if;

  select id, display_name into v_inviter, v_alias
  from profiles where invite_code = upper(btrim(coalesce(p_code, '')));

  if v_inviter is null then
    return json_build_object('result', 'invalid');
  end if;
  if v_inviter = v_me then
    return json_build_object('result', 'self');
  end if;

  update profiles set invited_by = v_inviter, invited_at = now()
  where id = v_me
    and invited_by is null
    and exists (select 1 from auth.users u where u.id = v_me and u.created_at > now() - interval '7 days');
  v_credited := found;

  insert into friendships (requester, addressee, status, source, accepted_at)
  values (v_inviter, v_me, 'accepted', 'invite', now())
  on conflict (least(requester, addressee), greatest(requester, addressee))
  do update set status = 'accepted', accepted_at = coalesce(friendships.accepted_at, now());

  return json_build_object('result', 'friends', 'alias', v_alias, 'credited', v_credited);
end;
$$;

revoke all on function send_friend_request(text) from public, anon;
revoke all on function respond_friend_request(uuid, boolean) from public, anon;
revoke all on function remove_friendship(uuid) from public, anon;
revoke all on function redeem_invite(text) from public, anon;
revoke all on function invite_preview(text) from public;
grant execute on function send_friend_request(text) to authenticated;
grant execute on function respond_friend_request(uuid, boolean) to authenticated;
grant execute on function remove_friendship(uuid) to authenticated;
grant execute on function redeem_invite(text) to authenticated;
grant execute on function invite_preview(text) to anon, authenticated;

-- ============================================================
-- 4. Invite XP bonus
-- ============================================================

alter table learning_events drop constraint if exists learning_events_kind_check;
alter table learning_events add constraint learning_events_kind_check
  check (kind in ('lesson_completed', 'exam_attempt', 'referral_bonus'));

-- When an invited learner finishes their first lesson (one that earned XP),
-- they and the person who invited them each get 100 XP, once.
create or replace function referral_bonus_on_first_lesson()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inviter uuid;
begin
  if new.kind <> 'lesson_completed' or new.xp <= 0 then
    return new;
  end if;

  select invited_by into v_inviter from profiles where id = new.user_id;
  if v_inviter is null then
    return new;
  end if;
  if exists (select 1 from learning_events where user_id = new.user_id and kind = 'referral_bonus') then
    return new;
  end if;

  insert into learning_events (user_id, occurred_at, kind, attempt_type, target_id, xp)
  values (new.user_id, new.occurred_at, 'referral_bonus', 'invitee', v_inviter, 100);

  if (select count(*) from learning_events where user_id = v_inviter and kind = 'referral_bonus' and attempt_type = 'inviter') < 25 then
    insert into learning_events (user_id, occurred_at, kind, attempt_type, target_id, xp)
    values (v_inviter, new.occurred_at, 'referral_bonus', 'inviter', new.user_id, 100);
  end if;
  return new;
end;
$$;

drop trigger if exists referral_bonus_on_first_lesson on learning_events;
create trigger referral_bonus_on_first_lesson
  after insert on learning_events
  for each row execute function referral_bonus_on_first_lesson();

-- ============================================================
-- 5. Invite-only avatars
-- ============================================================

alter table avatar_unlocks add column if not exists unlock_invites integer not null default 0;

insert into avatar_unlocks (avatar, unlock_level, unlock_invites) values
  ('handshake', 0, 1), ('constellation', 0, 3), ('flock', 0, 10)
on conflict (avatar) do update set unlock_level = excluded.unlock_level, unlock_invites = excluded.unlock_invites;

create or replace function check_profile_avatar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_needed integer;
  v_invites_needed integer;
  v_level integer;
begin
  if new.avatar is null or new.avatar is not distinct from old.avatar then
    return new;
  end if;
  select unlock_level, unlock_invites into v_needed, v_invites_needed from avatar_unlocks where avatar = new.avatar;
  if v_needed is null then
    raise exception 'Unknown avatar';
  end if;
  if v_needed > 0 then
    select level_for_xp(coalesce(sum(xp), 0)) into v_level from learning_events where user_id = new.id;
    if v_level < v_needed then
      raise exception 'This avatar unlocks at level %', v_needed;
    end if;
  end if;
  if v_invites_needed > 0 and (select count(*) from profiles where invited_by = new.id) < v_invites_needed then
    raise exception 'This avatar unlocks when % friends join with your invite', v_invites_needed;
  end if;
  return new;
end;
$$;

-- ============================================================
-- 6. Everything the Friends page needs, in one call
-- ============================================================

create or replace function my_friends()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'Not signed in';
  end if;

  return (
    with people as (
      select f.id as friendship_id, x.uid
      from friendships f
      cross join lateral (select case when f.requester = v_me then f.addressee else f.requester end as uid) x
      where f.status = 'accepted' and v_me in (f.requester, f.addressee)
      union all
      select null, v_me
    ), last_session as (
      select distinct on (ss.user_id) ss.user_id, ss.last_heartbeat_at,
             coalesce(l.course_id, sec.course_id) as course_id
      from study_sessions ss
      left join lessons l on l.id = ss.lesson_id
      left join sections sec on sec.id = ss.section_id
      where ss.user_id in (select uid from people)
      order by ss.user_id, ss.last_heartbeat_at desc
    ), card as (
      select pe.friendship_id, pe.uid, pe.uid = v_me as is_you,
             coalesce(nullif(btrim(p.display_name), ''), 'Orivian learner') as alias,
             p.avatar,
             (select coalesce(sum(xp), 0) from learning_events e where e.user_id = pe.uid) as total_xp,
             (select coalesce(sum(xp), 0) from learning_events e where e.user_id = pe.uid and e.occurred_at > now() - interval '7 days') as xp_week,
             (select count(*) from learning_events e where e.user_id = pe.uid and e.kind = 'lesson_completed' and e.occurred_at > now() - interval '7 days') as lessons_week,
             (select s.current_streak from streak_for(pe.uid, safe_tz(p.timezone)) s) as streak,
             ls.last_heartbeat_at as last_seen,
             c.title as current_course,
             coalesce((
               select json_agg(cp order by cp.last_active desc nulls last)
               from (
                 select co.title, co.slug,
                        (select count(*) from lessons l where l.course_id = co.id) as total,
                        (select count(*) from progress pr join lessons l on l.id = pr.lesson_id
                          where pr.user_id = pe.uid and l.course_id = co.id) as completed,
                        (select max(e.occurred_at) from learning_events e where e.user_id = pe.uid and e.course_id = co.id) as last_active
                 from enrollments en
                 join courses co on co.id = en.course_id
                 where en.user_id = pe.uid
                 order by last_active desc nulls last
                 limit 4
               ) cp
             ), '[]'::json) as courses
      from people pe
      join profiles p on p.id = pe.uid
      left join last_session ls on ls.user_id = pe.uid
      left join courses c on c.id = ls.course_id
    ), feed as (
      select e.occurred_at, e.kind, e.attempt_type,
             coalesce(nullif(btrim(p.display_name), ''), 'Orivian learner') as alias, p.avatar,
             case
               when e.kind = 'lesson_completed' then l.title
               when e.attempt_type = 'section_exam' then s.title
               when e.attempt_type = 'final_exam' then fe.title
             end as item,
             co.title as course, co.slug as course_slug,
             case when e.kind = 'referral_bonus' then (select display_name from profiles where id = e.target_id) end as invited_alias
      from learning_events e
      join profiles p on p.id = e.user_id
      left join lessons l on l.id = e.lesson_id
      left join sections s on s.id = e.target_id
      left join final_exams fe on fe.id = e.target_id
      left join courses co on co.id = e.course_id
      where e.user_id in (select uid from people where uid <> v_me)
        and e.occurred_at > now() - interval '14 days'
        and (
          (e.kind = 'lesson_completed' and e.xp > 0)
          or (e.kind = 'exam_attempt' and e.passed and e.attempt_type in ('section_exam', 'final_exam'))
          or (e.kind = 'referral_bonus' and e.attempt_type = 'inviter')
        )
      order by e.occurred_at desc
      limit 30
    )
    select json_build_object(
      'generated_at', now(),
      'friends', coalesce((
        select json_agg(json_build_object(
          'friendship_id', friendship_id, 'is_you', is_you, 'alias', alias, 'avatar', avatar,
          'total_xp', total_xp, 'xp_week', xp_week, 'lessons_week', lessons_week, 'streak', coalesce(streak, 0),
          'last_seen', last_seen, 'active_now', coalesce(last_seen > now() - interval '2 minutes', false),
          'current_course', current_course, 'courses', courses
        ) order by is_you, last_seen desc nulls last)
        from card
      ), '[]'::json),
      'feed', coalesce((select json_agg(f order by f.occurred_at desc) from feed f), '[]'::json),
      'incoming', coalesce((
        select json_agg(json_build_object(
          'id', f.id, 'alias', coalesce(nullif(btrim(p.display_name), ''), 'Orivian learner'), 'avatar', p.avatar,
          'total_xp', (select coalesce(sum(xp), 0) from learning_events e where e.user_id = p.id),
          'created_at', f.created_at
        ) order by f.created_at desc)
        from friendships f join profiles p on p.id = f.requester
        where f.addressee = v_me and f.status = 'pending'
      ), '[]'::json),
      'outgoing', coalesce((
        select json_agg(json_build_object(
          'id', f.id, 'alias', coalesce(nullif(btrim(p.display_name), ''), 'Orivian learner'), 'avatar', p.avatar,
          'created_at', f.created_at
        ) order by f.created_at desc)
        from friendships f join profiles p on p.id = f.addressee
        where f.requester = v_me and f.status = 'pending'
      ), '[]'::json),
      'invite', json_build_object(
        'code', (select invite_code from profiles where id = v_me),
        'joined', (select count(*) from profiles where invited_by = v_me),
        'qualified', (select count(*) from learning_events where user_id = v_me and kind = 'referral_bonus' and attempt_type = 'inviter')
      )
    )
  );
end;
$$;

-- Small summary for the navbar badge, profile and avatar picker.
create or replace function friends_summary()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'pending', (select count(*) from friendships where addressee = auth.uid() and status = 'pending'),
    'friends', (select count(*) from friend_ids(auth.uid())),
    'invite_code', (select invite_code from profiles where id = auth.uid()),
    'joined', (select count(*) from profiles where invited_by = auth.uid()),
    'qualified', (select count(*) from learning_events where user_id = auth.uid() and kind = 'referral_bonus' and attempt_type = 'inviter')
  );
$$;

drop function if exists friend_request_count();

revoke all on function my_friends() from public, anon;
revoke all on function friends_summary() from public, anon;
grant execute on function my_friends() to authenticated;
grant execute on function friends_summary() to authenticated;
