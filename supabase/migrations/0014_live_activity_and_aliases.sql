-- Live activity: who's studying now / recently, and a world map of where.
--
-- * Every learner gets a public alias (auto-generated, e.g. SwiftFalcon482),
--   which they confirm or change once. Public views only ever show aliases.
-- * Study sessions record a coarse location from the hosting provider:
--   US state, or country outside the US. Nothing more precise is stored.
-- * Learners who turn off "show me publicly" are left out of public lists
--   but still counted (anonymously) on the map. Admin sees everyone.
--
-- Requires 0010-0012. Safe to re-run.

-- ============================================================
-- 1. Coarse location on study sessions
-- ============================================================

alter table study_sessions
  add column if not exists country text,
  add column if not exists region text;

create index if not exists study_sessions_heartbeat_idx on study_sessions (last_heartbeat_at desc);

-- ============================================================
-- 2. Public aliases
-- ============================================================

alter table profiles add column if not exists alias_confirmed boolean not null default false;

create or replace function generate_alias()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  adjectives text[] := array['Swift', 'Bright', 'Calm', 'Bold', 'Quiet', 'Steady', 'Clever', 'Keen', 'Brave', 'Lucky', 'Noble', 'Rapid', 'Silent', 'Sunny', 'Wise', 'Amber', 'Golden', 'Silver', 'Northern', 'Eastern', 'Western', 'Southern', 'Hidden', 'Daring', 'Gentle', 'Vivid', 'Cosmic', 'Crisp', 'Mighty', 'Nimble'];
  nouns text[] := array['Falcon', 'Otter', 'Summit', 'Harbor', 'Comet', 'Maple', 'Cedar', 'River', 'Lynx', 'Heron', 'Fox', 'Raven', 'Willow', 'Pine', 'Ridge', 'Beacon', 'Compass', 'Canyon', 'Meadow', 'Orbit', 'Sparrow', 'Glacier', 'Badger', 'Aspen', 'Thunder', 'Kestrel', 'Owl', 'Tide', 'Quartz', 'Ember'];
  candidate text;
  attempts integer := 0;
begin
  loop
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
              || nouns[1 + floor(random() * array_length(nouns, 1))::int]
              || (10 + floor(random() * 990))::int;
    exit when not exists (select 1 from profiles where lower(display_name) = lower(candidate));
    attempts := attempts + 1;
    if attempts > 25 then
      candidate := candidate || floor(random() * 10000)::int;
      exit;
    end if;
  end loop;
  return candidate;
end;
$$;

-- Give everyone without an alias a generated one, and de-duplicate any
-- existing nicknames that clash (case-insensitively) before enforcing
-- uniqueness.
do $$
declare r record;
begin
  for r in select id from profiles where display_name is null or btrim(display_name) = '' loop
    update profiles set display_name = generate_alias() where id = r.id;
  end loop;

  for r in
    select id from (
      select id, row_number() over (partition by lower(btrim(display_name)) order by created_at, id) as rn
      from profiles
    ) d where rn > 1
  loop
    update profiles set display_name = left(btrim(display_name), 18) || floor(random() * 10000)::int, alias_confirmed = false where id = r.id;
  end loop;
end $$;

create unique index if not exists profiles_display_name_lower_idx on profiles (lower(display_name));

-- New profiles get an alias automatically; changed aliases must be valid.
create or replace function enforce_profile_alias()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.display_name is null or btrim(new.display_name) = '' then
    if tg_op = 'INSERT' then
      new.display_name := generate_alias();
      return new;
    end if;
    raise exception 'An alias is required';
  end if;

  if tg_op = 'UPDATE' and new.display_name is not distinct from old.display_name then
    return new;
  end if;

  new.display_name := btrim(new.display_name);
  if new.display_name !~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{1,22}[A-Za-z0-9]$' then
    raise exception 'Aliases must be 3-24 characters: letters, numbers, spaces, dots, dashes or underscores';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_alias on profiles;
create trigger enforce_profile_alias
  before insert or update of display_name on profiles
  for each row execute function enforce_profile_alias();

-- ============================================================
-- 3. Leaderboards show aliases only
-- ============================================================

create or replace function leaderboard()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with people as (
    select p.id,
           coalesce(nullif(btrim(p.display_name), ''), 'Orivian learner') as name,
           safe_tz(p.timezone) as tz,
           p.avatar,
           (select coalesce(sum(e.xp), 0) from learning_events e where e.user_id = p.id) as total_xp
    from profiles p
    where p.show_on_leaderboards
      and exists (select 1 from learning_events e where e.user_id = p.id)
  ), streaks as (
    select pe.id, pe.name, pe.avatar, pe.total_xp, s.current_streak, s.longest_streak
    from people pe cross join lateral streak_for(pe.id, pe.tz) s
  ), xp as (
    select e.user_id,
           sum(e.xp) filter (where e.occurred_at > now() - interval '24 hours') as xp_day,
           sum(e.xp) filter (where e.occurred_at > now() - interval '7 days') as xp_week
    from learning_events e
    where e.occurred_at > now() - interval '7 days'
    group by e.user_id
  )
  select json_build_object(
    'streaks', coalesce((
      select json_agg(r order by r.current desc, r.longest desc, r.name)
      from (
        select name, avatar, current_streak as current, longest_streak as longest, total_xp, id = auth.uid() as is_you
        from streaks where current_streak > 0 or longest_streak > 0
        order by current_streak desc, longest_streak desc, name
        limit 25
      ) r
    ), '[]'::json),
    'top_day', coalesce((
      select json_agg(r order by r.xp desc, r.name)
      from (
        select pe.name, pe.avatar, x.xp_day as xp, pe.total_xp, pe.id = auth.uid() as is_you
        from xp x join people pe on pe.id = x.user_id
        where x.xp_day > 0
        order by x.xp_day desc, pe.name
        limit 10
      ) r
    ), '[]'::json),
    'top_week', coalesce((
      select json_agg(r order by r.xp desc, r.name)
      from (
        select pe.name, pe.avatar, x.xp_week as xp, pe.total_xp, pe.id = auth.uid() as is_you
        from xp x join people pe on pe.id = x.user_id
        where x.xp_week > 0
        order by x.xp_week desc, pe.name
        limit 10
      ) r
    ), '[]'::json)
  );
$$;

revoke all on function leaderboard() from public, anon;
grant execute on function leaderboard() to authenticated;

-- ============================================================
-- 4. Public live activity (aliases only)
-- ============================================================
-- "Now" = studied in the last 2 minutes (the lesson player reports in
-- every ~20 seconds while a learner is active).

create or replace function live_activity()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select ss.user_id, ss.last_heartbeat_at,
           case when ss.country = 'US' and ss.region is not null then 'US-' || ss.region else ss.country end as region_key,
           coalesce(l.course_id, sec.course_id) as course_id
    from study_sessions ss
    left join lessons l on l.id = ss.lesson_id
    left join sections sec on sec.id = ss.section_id
    where ss.last_heartbeat_at > now() - interval '7 days'
  ), latest as (
    select distinct on (user_id) user_id, last_heartbeat_at as last_seen, course_id
    from s order by user_id, last_heartbeat_at desc
  ), people as (
    select la.user_id, la.last_seen, p.show_on_leaderboards as visible,
           coalesce(nullif(btrim(p.display_name), ''), 'Orivian learner') as alias, p.avatar,
           (select coalesce(sum(e.xp), 0) from learning_events e where e.user_id = la.user_id) as total_xp,
           c.title as course
    from latest la
    join profiles p on p.id = la.user_id
    left join courses c on c.id = la.course_id
  )
  select json_build_object(
    'generated_at', now(),
    'active_now', coalesce((
      select json_agg(json_build_object('alias', alias, 'avatar', avatar, 'total_xp', total_xp, 'course', course,
                                        'last_seen', last_seen, 'is_you', user_id = auth.uid()) order by last_seen desc)
      from people where visible and last_seen > now() - interval '2 minutes'
    ), '[]'::json),
    'active_hidden', (select count(*) from people where not visible and last_seen > now() - interval '2 minutes'),
    'recent', coalesce((
      select json_agg(r order by r.last_seen desc)
      from (
        select alias, avatar, total_xp, course, last_seen, user_id = auth.uid() as is_you
        from people
        where visible and last_seen <= now() - interval '2 minutes' and last_seen > now() - interval '24 hours'
        order by last_seen desc
        limit 20
      ) r
    ), '[]'::json),
    'recent_hidden', (
      select count(*) from people
      where not visible and last_seen <= now() - interval '2 minutes' and last_seen > now() - interval '24 hours'
    ),
    'totals', json_build_object(
      'now', (select count(*) from people where last_seen > now() - interval '2 minutes'),
      'day', (select count(*) from people where last_seen > now() - interval '24 hours'),
      'week', (select count(*) from people)
    ),
    'map', coalesce((
      select json_agg(json_build_object('key', region_key, 'now', n_now, 'day', n_day, 'week', n_week))
      from (
        select region_key,
               count(distinct user_id) filter (where last_heartbeat_at > now() - interval '2 minutes') as n_now,
               count(distinct user_id) filter (where last_heartbeat_at > now() - interval '24 hours') as n_day,
               count(distinct user_id) as n_week
        from s where region_key is not null
        group by region_key
      ) m
    ), '[]'::json)
  );
$$;

revoke all on function live_activity() from public, anon;
grant execute on function live_activity() to authenticated;

-- ============================================================
-- 5. Admin live activity (everyone, real names)
-- ============================================================

create or replace function admin_live_activity()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select ss.user_id, ss.last_heartbeat_at,
           case when ss.country = 'US' and ss.region is not null then 'US-' || ss.region else ss.country end as region_key,
           coalesce(l.course_id, sec.course_id) as course_id
    from study_sessions ss
    left join lessons l on l.id = ss.lesson_id
    left join sections sec on sec.id = ss.section_id
    where ss.last_heartbeat_at > now() - interval '7 days'
  ), latest as (
    select distinct on (user_id) user_id, last_heartbeat_at as last_seen, course_id, region_key
    from s order by user_id, last_heartbeat_at desc
  )
  select json_build_object(
    'generated_at', now(),
    'people', coalesce((
      select json_agg(json_build_object(
        'full_name', p.full_name, 'email', p.email, 'alias', p.display_name, 'avatar', p.avatar,
        'public', p.show_on_leaderboards, 'course', c.title, 'region', la.region_key, 'last_seen', la.last_seen,
        'total_xp', (select coalesce(sum(e.xp), 0) from learning_events e where e.user_id = la.user_id)
      ) order by la.last_seen desc)
      from latest la
      join profiles p on p.id = la.user_id
      left join courses c on c.id = la.course_id
    ), '[]'::json),
    'map', coalesce((
      select json_agg(json_build_object('key', region_key, 'now', n_now, 'day', n_day, 'week', n_week))
      from (
        select region_key,
               count(distinct user_id) filter (where last_heartbeat_at > now() - interval '2 minutes') as n_now,
               count(distinct user_id) filter (where last_heartbeat_at > now() - interval '24 hours') as n_day,
               count(distinct user_id) as n_week
        from s where region_key is not null
        group by region_key
      ) m
    ), '[]'::json)
  );
$$;

revoke all on function admin_live_activity() from public, anon, authenticated;
