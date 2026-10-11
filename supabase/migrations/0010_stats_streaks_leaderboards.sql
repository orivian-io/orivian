-- Stats, streaks, XP and leaderboards.
--
-- learning_events is an append-only activity log written by triggers when a
-- lesson is completed or an exam attempt is recorded. Streaks and XP read
-- from it, so they survive a learner resetting their progress (a reset
-- clears completions and attempts, but not the history of having studied).
-- Safe to re-run.

-- ============================================================
-- 1. Profile settings: nickname, timezone, leaderboard visibility
-- ============================================================

alter table profiles
  add column if not exists display_name text,
  add column if not exists timezone text,
  add column if not exists show_on_leaderboards boolean not null default true;

-- Returns a valid IANA timezone name, falling back to Eastern time.
create or replace function safe_tz(p_tz text)
returns text
language plpgsql
stable
as $$
begin
  if p_tz is null or btrim(p_tz) = '' then
    return 'America/New_York';
  end if;
  perform now() at time zone p_tz;
  return p_tz;
exception when others then
  return 'America/New_York';
end;
$$;

-- ============================================================
-- 2. Activity log
-- ============================================================

create table if not exists learning_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind text not null check (kind in ('lesson_completed', 'exam_attempt')),
  course_id uuid references courses(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  section_id uuid references sections(id) on delete set null,
  attempt_type text,
  target_id uuid, -- lesson, checkpoint section, or final exam the attempt was for
  answered integer not null default 0,
  correct integer not null default 0,
  passed boolean,
  xp integer not null default 0,
  source_id uuid -- the progress row or exam attempt this came from
);

create unique index if not exists learning_events_source_idx on learning_events (kind, source_id) where source_id is not null;
create index if not exists learning_events_user_time_idx on learning_events (user_id, occurred_at desc);
create index if not exists learning_events_time_idx on learning_events (occurred_at desc);

alter table learning_events enable row level security;

drop policy if exists "learners read own learning events" on learning_events;
create policy "learners read own learning events"
  on learning_events for select
  using (user_id = auth.uid());

-- XP rules:
--   lesson completed (first time ever)   50 XP   (recap / orientation: 20)
--   each correct exam answer              1 XP   (first 3 attempts per exam per day)
--   first pass of a domain checkpoint   100 XP
--   first pass of a practice exam       150 XP

create or replace function learning_event_from_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course uuid;
  v_section uuid;
  v_type text;
  v_xp integer;
begin
  select course_id, section_id, lesson_type into v_course, v_section, v_type from lessons where id = new.lesson_id;
  v_xp := case when v_type in ('recap', 'orientation') then 20 else 50 end;
  if exists (
    select 1 from learning_events
    where user_id = new.user_id and kind = 'lesson_completed' and lesson_id = new.lesson_id
  ) then
    v_xp := 0;
  end if;

  insert into learning_events (user_id, occurred_at, kind, course_id, lesson_id, section_id, target_id, xp, source_id)
  values (new.user_id, coalesce(new.completed_at, now()), 'lesson_completed', v_course, new.lesson_id, v_section, new.lesson_id, v_xp, new.id)
  on conflict (kind, source_id) where source_id is not null do nothing;
  return new;
end;
$$;

drop trigger if exists learning_event_from_progress on progress;
create trigger learning_event_from_progress
  after insert on progress
  for each row execute function learning_event_from_progress();

create or replace function learning_event_from_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course uuid;
  v_section uuid := new.section_id;
  v_target uuid := coalesce(new.lesson_id, new.section_id, new.final_exam_id);
  v_answered integer := coalesce(new.question_count, 0);
  v_correct integer;
  v_recent integer;
  v_xp integer := 0;
begin
  if new.completed_at is null or new.score_percent is null then
    return new;
  end if;

  if new.lesson_id is not null then
    select course_id, coalesce(v_section, section_id) into v_course, v_section from lessons where id = new.lesson_id;
  elsif new.section_id is not null then
    select course_id into v_course from sections where id = new.section_id;
  elsif new.final_exam_id is not null then
    select course_id into v_course from final_exams where id = new.final_exam_id;
  end if;

  v_correct := round(new.score_percent * v_answered / 100.0);

  select count(*) into v_recent from learning_events
  where user_id = new.user_id and kind = 'exam_attempt' and target_id = v_target
    and occurred_at > new.completed_at - interval '24 hours';

  if v_recent < 3 then
    v_xp := v_correct;
  end if;

  if new.passed and new.attempt_type in ('section_exam', 'final_exam') and not exists (
    select 1 from learning_events
    where user_id = new.user_id and kind = 'exam_attempt' and target_id = v_target and passed
  ) then
    v_xp := v_xp + case new.attempt_type when 'section_exam' then 100 else 150 end;
  end if;

  insert into learning_events (user_id, occurred_at, kind, course_id, section_id, lesson_id, attempt_type, target_id, answered, correct, passed, xp, source_id)
  values (new.user_id, new.completed_at, 'exam_attempt', v_course, v_section, new.lesson_id, new.attempt_type, v_target, v_answered, v_correct, new.passed, v_xp, new.id)
  on conflict (kind, source_id) where source_id is not null do nothing;
  return new;
end;
$$;

drop trigger if exists learning_event_from_attempt on exam_attempts;
create trigger learning_event_from_attempt
  after insert on exam_attempts
  for each row execute function learning_event_from_attempt();

-- Backfill history that existed before this migration (oldest first so the
-- "first time" XP rules apply in order).
do $$
declare r record;
begin
  for r in
    select 'p' as src, id, completed_at as at from progress
    where not exists (select 1 from learning_events e where e.kind = 'lesson_completed' and e.source_id = progress.id)
    union all
    select 'a', id, completed_at from exam_attempts
    where completed_at is not null
      and not exists (select 1 from learning_events e where e.kind = 'exam_attempt' and e.source_id = exam_attempts.id)
    order by at
  loop
    if r.src = 'p' then
      insert into learning_events (user_id, occurred_at, kind, course_id, lesson_id, section_id, target_id, xp, source_id)
      select p.user_id, p.completed_at, 'lesson_completed', l.course_id, p.lesson_id, l.section_id, p.lesson_id,
             case when exists (select 1 from learning_events e where e.user_id = p.user_id and e.kind = 'lesson_completed' and e.lesson_id = p.lesson_id) then 0
                  when l.lesson_type in ('recap', 'orientation') then 20 else 50 end,
             p.id
      from progress p left join lessons l on l.id = p.lesson_id
      where p.id = r.id
      on conflict (kind, source_id) where source_id is not null do nothing;
    else
      insert into learning_events (user_id, occurred_at, kind, course_id, section_id, lesson_id, attempt_type, target_id, answered, correct, passed, xp, source_id)
      select a.user_id, a.completed_at, 'exam_attempt',
             coalesce(l.course_id, s.course_id, f.course_id), coalesce(a.section_id, l.section_id), a.lesson_id, a.attempt_type,
             coalesce(a.lesson_id, a.section_id, a.final_exam_id),
             coalesce(a.question_count, 0), round(coalesce(a.score_percent, 0) * coalesce(a.question_count, 0) / 100.0), a.passed,
             round(coalesce(a.score_percent, 0) * coalesce(a.question_count, 0) / 100.0)::int,
             a.id
      from exam_attempts a
      left join lessons l on l.id = a.lesson_id
      left join sections s on s.id = a.section_id
      left join final_exams f on f.id = a.final_exam_id
      where a.id = r.id
      on conflict (kind, source_id) where source_id is not null do nothing;
    end if;
  end loop;
end $$;

-- ============================================================
-- 3. Streaks (a day counts when at least one lesson is completed,
--    in the learner's own timezone)
-- ============================================================

create or replace function streak_for(p_user_id uuid, p_tz text)
returns table (current_streak integer, longest_streak integer, studied_today boolean)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select distinct (occurred_at at time zone p_tz)::date as day
    from learning_events
    where user_id = p_user_id and kind = 'lesson_completed'
  ), grouped as (
    select day, day - (row_number() over (order by day))::int as grp from days
  ), islands as (
    select max(day) as last_day, count(*)::int as len from grouped group by grp
  ), today as (
    select (now() at time zone p_tz)::date as t
  )
  select
    coalesce((select len from islands, today where last_day >= t - 1 order by last_day desc limit 1), 0),
    coalesce((select max(len) from islands), 0),
    exists (select 1 from days, today where day = t);
$$;

revoke all on function streak_for(uuid, text) from public, anon, authenticated;

-- ============================================================
-- 4. A learner's own stats, in one call
-- ============================================================

create or replace function my_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tz text;
  v_result json;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  select safe_tz(timezone) into v_tz from profiles where id = v_uid;
  v_tz := coalesce(v_tz, 'America/New_York');

  with answers as (
    select ea.completed_at as at, a.correct,
           coalesce(l.course_id, s.course_id) as course_id,
           coalesce(l.section_id, q.section_id) as section_id
    from exam_attempt_answers a
    join exam_attempts ea on ea.id = a.attempt_id
    join questions q on q.id = a.question_id
    left join lessons l on l.id = q.lesson_id
    left join sections s on s.id = coalesce(l.section_id, q.section_id)
    where ea.user_id = v_uid
    union all
    select ea.completed_at, a.correct, fe.course_id, fq.domain_section_id
    from final_exam_attempt_answers a
    join exam_attempts ea on ea.id = a.attempt_id
    join final_exam_questions fq on fq.id = a.question_id
    join final_exams fe on fe.id = fq.final_exam_id
    where ea.user_id = v_uid
  ), events as (
    select * from learning_events where user_id = v_uid
  )
  select json_build_object(
    'timezone', v_tz,
    'accuracy', json_build_object(
      'all', (select json_build_object('answered', count(*), 'correct', count(*) filter (where correct)) from answers),
      'week', (select json_build_object('answered', count(*), 'correct', count(*) filter (where correct)) from answers where at > now() - interval '7 days'),
      'day', (select json_build_object('answered', count(*), 'correct', count(*) filter (where correct)) from answers where at > now() - interval '24 hours')
    ),
    'daily', coalesce((
      select json_agg(json_build_object('day', d, 'answered', n, 'correct', c) order by d)
      from (
        select (at at time zone v_tz)::date as d, count(*) as n, count(*) filter (where correct) as c
        from answers
        where at > now() - interval '31 days'
        group by 1
      ) x
    ), '[]'::json),
    'courses', coalesce((
      select json_agg(json_build_object(
        'course_id', co.id, 'title', co.title, 'slug', co.slug,
        'answered', x.n, 'correct', x.c,
        'sections', (
          select coalesce(json_agg(json_build_object('section_id', se.id, 'title', se.title, 'answered', y.n, 'correct', y.c) order by se.order_index), '[]'::json)
          from (
            select section_id, count(*) as n, count(*) filter (where correct) as c
            from answers where course_id = co.id and section_id is not null group by section_id
          ) y join sections se on se.id = y.section_id
        )
      ) order by x.n desc)
      from (
        select course_id, count(*) as n, count(*) filter (where correct) as c
        from answers where course_id is not null group by course_id
      ) x join courses co on co.id = x.course_id
    ), '[]'::json),
    'streak', (
      select json_build_object('current', current_streak, 'longest', longest_streak, 'studied_today', studied_today)
      from streak_for(v_uid, v_tz)
    ),
    'days', coalesce((
      select json_agg(json_build_object('day', d, 'lessons', lessons, 'xp', xp) order by d)
      from (
        select (occurred_at at time zone v_tz)::date as d,
               count(*) filter (where kind = 'lesson_completed') as lessons,
               sum(xp) as xp
        from events
        where occurred_at > now() - interval '400 days'
        group by 1
      ) z
    ), '[]'::json),
    'xp', json_build_object(
      'total', (select coalesce(sum(xp), 0) from events),
      'week', (select coalesce(sum(xp), 0) from events where occurred_at > now() - interval '7 days'),
      'day', (select coalesce(sum(xp), 0) from events where occurred_at > now() - interval '24 hours')
    ),
    'lessons_completed', (select count(distinct lesson_id) from events where kind = 'lesson_completed')
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function my_stats() from public, anon;
grant execute on function my_stats() to authenticated;

-- ============================================================
-- 5. Leaderboards (names only - never emails)
-- ============================================================
-- Shows a learner's nickname if they set one, otherwise their full name.
-- Learners who turned off "Show me on leaderboards" are left out.

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
           safe_tz(p.timezone) as tz
    from profiles p
    where p.show_on_leaderboards
      and exists (select 1 from learning_events e where e.user_id = p.id)
  ), streaks as (
    select pe.id, pe.name, s.current_streak, s.longest_streak
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
        select name, current_streak as current, longest_streak as longest, id = auth.uid() as is_you
        from streaks where current_streak > 0 or longest_streak > 0
        order by current_streak desc, longest_streak desc, name
        limit 25
      ) r
    ), '[]'::json),
    'top_day', coalesce((
      select json_agg(r order by r.xp desc, r.name)
      from (
        select pe.name, x.xp_day as xp, pe.id = auth.uid() as is_you
        from xp x join people pe on pe.id = x.user_id
        where x.xp_day > 0
        order by x.xp_day desc, pe.name
        limit 10
      ) r
    ), '[]'::json),
    'top_week', coalesce((
      select json_agg(r order by r.xp desc, r.name)
      from (
        select pe.name, x.xp_week as xp, pe.id = auth.uid() as is_you
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
