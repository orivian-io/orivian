-- 0018: First-party site traffic for the admin page.
--
-- Every page view on orivian.io (signed in or not) is recorded by
-- /api/track. What's stored is deliberately coarse:
--   * no IP addresses: visitors are an anonymous id that changes every day
--     (a hash made on the server), so a visitor can't be followed across days
--   * location only at US-state / country level (same as the live map)
--   * referrer as a site name only (e.g. www.linkedin.com), never a full URL
-- Only the server (service role) can read or write this table.
--
-- Because the visitor id resets daily, "visitors" over a period means
-- daily unique visitors added up.
--
-- Safe to re-run.

create table if not exists page_views (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  visitor text not null,
  path text not null,
  landing boolean not null default false,
  referrer text,
  utm_source text,
  country text,
  region text,
  device text check (device in ('mobile', 'tablet', 'desktop')),
  user_id uuid references auth.users(id) on delete set null
);

create index if not exists page_views_time_idx on page_views (occurred_at desc);
create index if not exists page_views_visitor_idx on page_views (visitor, occurred_at);

alter table page_views enable row level security;
-- No policies: only the service role can read or write.

create or replace function admin_traffic(p_days integer default 30)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select greatest(1, least(coalesce(p_days, 30), 365)) as days
  ), v as (
    select pv.*,
           case when pv.country = 'US' and pv.region is not null then 'US-' || pv.region else pv.country end as region_key
    from page_views pv, bounds b
    where pv.occurred_at > now() - make_interval(days => b.days)
  ), prev as (
    select pv.visitor, pv.id
    from page_views pv, bounds b
    where pv.occurred_at <= now() - make_interval(days => b.days)
      and pv.occurred_at > now() - make_interval(days => b.days * 2)
  ), per_visitor as (
    select visitor, count(*) as views, bool_or(user_id is not null) as signed_in
    from v group by visitor
  ), days as (
    select generate_series(
      (now() at time zone 'America/New_York')::date - ((select days from bounds) - 1),
      (now() at time zone 'America/New_York')::date,
      interval '1 day'
    )::date as d
  ), new_learners as (
    select p.id from profiles p, bounds b where p.created_at > now() - make_interval(days => b.days)
  )
  select json_build_object(
    'generated_at', now(),
    'days', (select days from bounds),

    'totals', json_build_object(
      'visitors', (select count(*) from per_visitor),
      'visitors_prev', (select count(distinct visitor) from prev),
      'views', (select count(*) from v),
      'views_prev', (select count(*) from prev),
      'signed_in_visitors', (select count(*) from per_visitor where signed_in),
      'single_page_visitors', (select count(*) from per_visitor where views = 1),
      'now', (select count(distinct visitor) from v where occurred_at > now() - interval '5 minutes')
    ),

    'daily', (
      select json_agg(json_build_object(
        'day', d,
        'visitors', (select count(distinct visitor) from v where (occurred_at at time zone 'America/New_York')::date = d),
        'views', (select count(*) from v where (occurred_at at time zone 'America/New_York')::date = d),
        'signups', (select count(*) from profiles where (created_at at time zone 'America/New_York')::date = d)
      ) order by d)
      from days
    ),

    'pages', coalesce((
      select json_agg(t) from (
        select path, count(*) as views, count(distinct visitor) as visitors
        from v group by path order by visitors desc, views desc limit 15
      ) t
    ), '[]'::json),

    'landing', coalesce((
      select json_agg(t) from (
        select path, count(distinct visitor) as visitors
        from v where landing group by path order by visitors desc limit 8
      ) t
    ), '[]'::json),

    'referrers', coalesce((
      select json_agg(t) from (
        select coalesce(referrer, 'Direct or unknown') as source, count(distinct visitor) as visitors
        from v where landing group by 1 order by visitors desc limit 12
      ) t
    ), '[]'::json),

    'campaigns', coalesce((
      select json_agg(t) from (
        select utm_source as source, count(distinct visitor) as visitors
        from v where utm_source is not null group by 1 order by visitors desc limit 8
      ) t
    ), '[]'::json),

    'devices', coalesce((
      select json_agg(t) from (
        select coalesce(device, 'unknown') as device, count(distinct visitor) as visitors
        from v group by 1 order by visitors desc
      ) t
    ), '[]'::json),

    'places', coalesce((
      select json_agg(t) from (
        select region_key as key,
               count(distinct visitor) filter (where occurred_at > now() - interval '5 minutes') as now,
               count(distinct visitor) filter (where occurred_at > now() - interval '24 hours') as day,
               count(distinct visitor) filter (where occurred_at > now() - interval '7 days') as week,
               count(distinct visitor) as month
        from v where region_key is not null
        group by region_key order by month desc
      ) t
    ), '[]'::json),

    'funnel', json_build_object(
      'visitors', (select count(*) from per_visitor where not signed_in),
      'signups', (select count(*) from new_learners),
      'started', (select count(*) from new_learners n where exists (
        select 1 from study_sessions ss where ss.user_id = n.id
      )),
      'first_lesson', (select count(*) from new_learners n where exists (
        select 1 from learning_events e where e.user_id = n.id and e.kind = 'lesson_completed'
      )),
      'via_invite', (select count(*) from profiles p, bounds b
                     where p.invited_by is not null and p.invited_at > now() - make_interval(days => b.days))
    )
  );
$$;

revoke all on function admin_traffic(integer) from public, anon, authenticated;
