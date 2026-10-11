-- 0015: Public activity pulse for the visitor homepage.
--
-- Signed-out visitors see a world map of where people are studying and a
-- short feed of recently completed lessons. Everything here is aggregate or
-- anonymous: no names, aliases, avatars or user ids ever leave this
-- function. Locations stay at US-state / country level (same as 0014).
--
-- The map counts everyone (opting out hides your alias, not your dot).
-- The feed only includes learners who have "Show me publicly" switched on,
-- and even then shows just the lesson, course, place and time.
--
-- Safe to re-run.

create or replace function public_activity_pulse()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select ss.user_id, ss.last_heartbeat_at, ss.country,
           case when ss.country = 'US' and ss.region is not null then 'US-' || ss.region else ss.country end as region_key
    from study_sessions ss
    where ss.last_heartbeat_at > now() - interval '30 days'
  ), home as (
    -- Each learner's most recent known location (for the feed).
    select distinct on (user_id) user_id, region_key
    from s where region_key is not null
    order by user_id, last_heartbeat_at desc
  ), feed as (
    select e.occurred_at, l.title as lesson, c.title as course, c.slug as course_slug, h.region_key as place
    from learning_events e
    join profiles p on p.id = e.user_id and p.show_on_leaderboards
    left join lessons l on l.id = e.lesson_id
    left join courses c on c.id = e.course_id
    left join home h on h.user_id = e.user_id
    where e.kind = 'lesson_completed'
      and e.occurred_at > now() - interval '7 days'
      and l.title is not null
    order by e.occurred_at desc
    limit 8
  )
  select json_build_object(
    'generated_at', now(),
    'totals', json_build_object(
      'now',   (select count(distinct user_id) from s where last_heartbeat_at > now() - interval '2 minutes'),
      'day',   (select count(distinct user_id) from s where last_heartbeat_at > now() - interval '24 hours'),
      'week',  (select count(distinct user_id) from s where last_heartbeat_at > now() - interval '7 days'),
      'month', (select count(distinct user_id) from s),
      'countries', (select count(distinct country) from s where country is not null),
      'lessons_week', (
        select count(*) from learning_events
        where kind = 'lesson_completed' and occurred_at > now() - interval '7 days'
      )
    ),
    'map', coalesce((
      select json_agg(json_build_object('key', region_key, 'now', n_now, 'day', n_day, 'week', n_week, 'month', n_month))
      from (
        select region_key,
               count(distinct user_id) filter (where last_heartbeat_at > now() - interval '2 minutes') as n_now,
               count(distinct user_id) filter (where last_heartbeat_at > now() - interval '24 hours') as n_day,
               count(distinct user_id) filter (where last_heartbeat_at > now() - interval '7 days') as n_week,
               count(distinct user_id) as n_month
        from s where region_key is not null
        group by region_key
      ) m
    ), '[]'::json),
    'feed', coalesce((
      select json_agg(json_build_object('at', occurred_at, 'lesson', lesson, 'course', course,
                                        'course_slug', course_slug, 'place', place) order by occurred_at desc)
      from feed
    ), '[]'::json)
  );
$$;

revoke all on function public_activity_pulse() from public;
grant execute on function public_activity_pulse() to anon, authenticated;
