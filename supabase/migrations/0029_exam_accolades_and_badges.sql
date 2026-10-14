-- ============================================================
-- 0029: Exam accolades + badges
-- ============================================================
-- Every time a learner earns an accolade on an exam (a perfect score,
-- the day's first perfect, a first-try ace, a comeback pass, ...) a row
-- lands in accolade_events. Badges are derived from these counts in the
-- app (lib/badges.ts), so adding or re-tiering a badge never needs a
-- migration.
--
-- Accolade rows deliberately outlive a progress reset: reset deletes
-- exam_attempts, and attempt_id simply goes null here. That keeps badges
-- permanent AND stops "reset, re-ace, re-earn" farming, because each
-- accolade is unique per learner + kind + exam (lesson, checkpoint
-- section, or final exam). Retaking an exam you've already aced still
-- shows a perfect-score moment, it just doesn't count twice.
--
-- Accolade kinds:
--   perfect            100% on an exam (once per exam)
--   first_try_perfect  100% on the very first attempt at that exam
--   daily_perfect      the first NEW perfect score of the learner's day
--                      (in their own timezone) - one per day
--   checkpoint_perfect 100% on a domain checkpoint
--   comeback           passed an exam right after failing it
--   final_pass         passing-equivalent score on a full practice exam
--   final_excellent    90%+ on a full practice exam

create table if not exists accolade_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in (
    'perfect', 'first_try_perfect', 'daily_perfect', 'checkpoint_perfect',
    'comeback', 'final_pass', 'final_excellent'
  )),
  -- lesson_id, section_id or final_exam_id of the exam. No FK, so the
  -- record survives content being rebuilt.
  target_id uuid not null,
  attempt_type text,
  attempt_id uuid references exam_attempts(id) on delete set null,
  score_percent numeric,
  local_day date not null,
  created_at timestamptz not null default now()
);

create index if not exists accolade_events_user_idx on accolade_events (user_id, created_at desc);

-- One of each accolade per exam...
create unique index if not exists accolade_events_once_per_target
  on accolade_events (user_id, kind, target_id)
  where kind <> 'daily_perfect';

-- ...and one daily perfect per learner per day.
create unique index if not exists accolade_events_once_per_day
  on accolade_events (user_id, local_day)
  where kind = 'daily_perfect';

alter table accolade_events enable row level security;

drop policy if exists "users read own accolades" on accolade_events;
create policy "users read own accolades"
  on accolade_events for select
  using (auth.uid() = user_id);

-- No insert/update policy for client roles: accolades are only written by
-- award_exam_accolades(), which the server-side grading routes call with
-- the service role right after an attempt is recorded.

-- ------------------------------------------------------------
-- award_exam_accolades(attempt) -> json
--   { awarded: [kinds], before: {kind: n}, after: {kind: n},
--     perfect: bool, repeat_perfect: bool }
-- ------------------------------------------------------------
create or replace function award_exam_accolades(p_attempt_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  a exam_attempts%rowtype;
  v_target uuid;
  v_tz text;
  v_day date;
  v_perfect boolean;
  v_new_perfect boolean := false;
  v_prior_attempts integer;
  v_prev_passed boolean;
  v_before json;
  v_after json;
  v_awarded text[] := '{}';
  v_rows integer;
  k text;
  v_kinds text[] := '{}';
begin
  select * into a from exam_attempts where id = p_attempt_id;
  if not found then
    raise exception 'Attempt not found';
  end if;
  if a.attempt_type not in ('mini_exam', 'section_exam', 'final_exam') then
    return json_build_object('awarded', '[]'::json, 'before', '{}'::json, 'after', '{}'::json,
                             'perfect', false, 'repeat_perfect', false);
  end if;

  v_target := coalesce(a.lesson_id, a.section_id, a.final_exam_id);
  select safe_tz(timezone) into v_tz from profiles where id = a.user_id;
  v_tz := coalesce(v_tz, 'America/New_York');
  v_day := (a.completed_at at time zone v_tz)::date;
  v_perfect := a.score_percent >= 100;

  select coalesce(json_object_agg(kind, n), '{}'::json) into v_before
  from (select kind, count(*) as n from accolade_events where user_id = a.user_id group by kind) x;

  select count(*) into v_prior_attempts
  from exam_attempts
  where user_id = a.user_id and id <> a.id
    and coalesce(lesson_id, section_id, final_exam_id) = v_target
    and completed_at <= a.completed_at;

  select passed into v_prev_passed
  from exam_attempts
  where user_id = a.user_id and id <> a.id
    and coalesce(lesson_id, section_id, final_exam_id) = v_target
    and completed_at <= a.completed_at
  order by completed_at desc
  limit 1;

  -- Work out which accolades this attempt qualifies for, in display order.
  if v_perfect then
    insert into accolade_events (user_id, kind, target_id, attempt_type, attempt_id, score_percent, local_day)
    values (a.user_id, 'perfect', v_target, a.attempt_type, a.id, a.score_percent, v_day)
    on conflict do nothing;
    get diagnostics v_rows = row_count;
    v_new_perfect := v_rows > 0;
    if v_new_perfect then
      v_awarded := v_awarded || 'perfect';
      v_kinds := v_kinds || 'daily_perfect';
      if v_prior_attempts = 0 then v_kinds := v_kinds || 'first_try_perfect'; end if;
      if a.attempt_type = 'section_exam' then v_kinds := v_kinds || 'checkpoint_perfect'; end if;
    end if;
  end if;

  if a.passed and v_prev_passed is false then
    v_kinds := v_kinds || 'comeback';
  end if;

  if a.attempt_type = 'final_exam' then
    if a.passed then v_kinds := v_kinds || 'final_pass'; end if;
    if a.score_percent >= 90 then v_kinds := v_kinds || 'final_excellent'; end if;
  end if;

  foreach k in array v_kinds loop
    insert into accolade_events (user_id, kind, target_id, attempt_type, attempt_id, score_percent, local_day)
    values (a.user_id, k, v_target, a.attempt_type, a.id, a.score_percent, v_day)
    on conflict do nothing;
    get diagnostics v_rows = row_count;
    if v_rows > 0 then
      v_awarded := v_awarded || k;
    end if;
  end loop;

  select coalesce(json_object_agg(kind, n), '{}'::json) into v_after
  from (select kind, count(*) as n from accolade_events where user_id = a.user_id group by kind) x;

  return json_build_object(
    'awarded', to_json(v_awarded),
    'before', v_before,
    'after', v_after,
    'perfect', v_perfect,
    'repeat_perfect', v_perfect and not v_new_perfect
  );
end;
$$;

revoke all on function award_exam_accolades(uuid) from public, anon, authenticated;
grant execute on function award_exam_accolades(uuid) to service_role;
