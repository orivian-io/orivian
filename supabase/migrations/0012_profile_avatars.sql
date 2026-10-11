-- Profile avatars: learners choose from Orivian's curated set (no uploads).
-- Gold avatars unlock at certain levels; this is enforced here as well as in
-- the app. Leaderboards return each learner's avatar. Requires 0010 and 0011.
-- Safe to re-run.

alter table profiles add column if not exists avatar text;

-- Which avatars exist and the level each needs (0 = available to everyone).
-- Keep in sync with lib/avatars.tsx.
create table if not exists avatar_unlocks (
  avatar text primary key,
  unlock_level integer not null default 0
);

insert into avatar_unlocks (avatar, unlock_level) values
  ('compass', 0), ('peak', 0), ('north-star', 0), ('lantern', 0),
  ('key', 0), ('shield', 0), ('book', 0), ('lighthouse', 0),
  ('leaf', 0), ('wave', 0), ('sun', 0), ('moon', 0),
  ('feather', 0), ('hourglass', 0), ('anchor', 0), ('lightbulb', 0),
  ('campfire', 2), ('pine', 3), ('bridge', 4), ('telescope', 5),
  ('sailboat', 6), ('balloon', 7), ('snowflake', 8), ('basecamp', 10),
  ('rocket', 12), ('gem', 14), ('planet', 16), ('crown', 18),
  ('trail-map', 20), ('trophy', 25), ('summit-flag', 30), ('laurel', 40)
on conflict (avatar) do update set unlock_level = excluded.unlock_level;

-- Remove avatars no longer offered (learners using one fall back to initials).
delete from avatar_unlocks where avatar not in ('compass', 'peak', 'north-star', 'lantern', 'key', 'shield', 'book', 'lighthouse', 'leaf', 'wave', 'sun', 'moon', 'feather', 'hourglass', 'anchor', 'lightbulb', 'campfire', 'pine', 'bridge', 'telescope', 'sailboat', 'balloon', 'snowflake', 'basecamp', 'rocket', 'gem', 'planet', 'crown', 'trail-map', 'trophy', 'summit-flag', 'laurel');
update profiles set avatar = null where avatar is not null and avatar not in (select avatar from avatar_unlocks);

alter table avatar_unlocks enable row level security;
drop policy if exists "avatar unlocks are readable" on avatar_unlocks;
create policy "avatar unlocks are readable" on avatar_unlocks for select using (true);

-- Same curve as lib/levels.ts: reaching level n takes 50 * n * (n - 1) XP.
create or replace function level_for_xp(p_xp bigint)
returns integer
language plpgsql
immutable
as $$
declare
  v_level integer := greatest(1, floor((1 + sqrt(1 + 0.08 * greatest(p_xp, 0))) / 2)::integer);
begin
  while 50 * (v_level + 1) * v_level <= p_xp loop
    v_level := v_level + 1;
  end loop;
  while v_level > 1 and 50 * v_level * (v_level - 1) > p_xp loop
    v_level := v_level - 1;
  end loop;
  return v_level;
end;
$$;

create or replace function check_profile_avatar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_needed integer;
  v_level integer;
begin
  if new.avatar is null or new.avatar is not distinct from old.avatar then
    return new;
  end if;
  select unlock_level into v_needed from avatar_unlocks where avatar = new.avatar;
  if v_needed is null then
    raise exception 'Unknown avatar';
  end if;
  if v_needed > 0 then
    select level_for_xp(coalesce(sum(xp), 0)) into v_level from learning_events where user_id = new.id;
    if v_level < v_needed then
      raise exception 'This avatar unlocks at level %', v_needed;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists check_profile_avatar on profiles;
create trigger check_profile_avatar
  before update of avatar on profiles
  for each row execute function check_profile_avatar();

create or replace function leaderboard()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with people as (
    select p.id,
           coalesce(nullif(btrim(p.display_name), ''), nullif(btrim(p.full_name), ''), 'Orivian learner') as name,
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
