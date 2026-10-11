-- Levels: leaderboards now include each learner's all-time XP, so the app
-- can show their level next to their name. Levels themselves are computed
-- in the app from XP (lib/levels.ts). Requires 0010. Safe to re-run.

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
           (select coalesce(sum(e.xp), 0) from learning_events e where e.user_id = p.id) as total_xp
    from profiles p
    where p.show_on_leaderboards
      and exists (select 1 from learning_events e where e.user_id = p.id)
  ), streaks as (
    select pe.id, pe.name, pe.total_xp, s.current_streak, s.longest_streak
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
        select name, current_streak as current, longest_streak as longest, total_xp, id = auth.uid() as is_you
        from streaks where current_streak > 0 or longest_streak > 0
        order by current_streak desc, longest_streak desc, name
        limit 25
      ) r
    ), '[]'::json),
    'top_day', coalesce((
      select json_agg(r order by r.xp desc, r.name)
      from (
        select pe.name, x.xp_day as xp, pe.total_xp, pe.id = auth.uid() as is_you
        from xp x join people pe on pe.id = x.user_id
        where x.xp_day > 0
        order by x.xp_day desc, pe.name
        limit 10
      ) r
    ), '[]'::json),
    'top_week', coalesce((
      select json_agg(r order by r.xp desc, r.name)
      from (
        select pe.name, x.xp_week as xp, pe.total_xp, pe.id = auth.uid() as is_you
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
