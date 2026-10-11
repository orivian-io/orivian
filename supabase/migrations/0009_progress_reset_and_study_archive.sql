-- Progress reset (course or lesson) with an optional study-timer reset,
-- plus an admin view of lifetime study time.
--
-- A timer reset never destroys time: the learner's sessions move to
-- study_sessions_archive, so every learner-facing timer (which only reads
-- study_sessions) starts from zero while admin reporting still sees the
-- full lifetime total. Safe to re-run.

-- ============================================================
-- 1. Archive of study time a learner has reset
-- ============================================================

create table if not exists study_sessions_archive (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  section_id uuid references sections(id) on delete set null,
  client_session_id uuid,
  started_at timestamptz,
  last_heartbeat_at timestamptz,
  duration_seconds integer not null default 0,
  archived_at timestamptz not null default now(),
  archive_reason text not null
);

create index if not exists study_sessions_archive_user_course_idx on study_sessions_archive (user_id, course_id);

-- No policies: only the server (service role) can read or write this table.
alter table study_sessions_archive enable row level security;

-- ============================================================
-- 2. Reset a learner's progress for a whole course or one lesson
-- ============================================================
-- Clears lesson completions and exam attempts (mini-exams; for a course
-- reset also domain checkpoints and practice/final exams). Enrollment and
-- notes are kept. When p_reset_study_time is true, the matching study
-- sessions move to the archive. Runs as one transaction.

create or replace function reset_learning_progress(
  p_user_id uuid,
  p_course_id uuid,
  p_lesson_id uuid,
  p_reset_study_time boolean
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid := p_course_id;
  v_lessons uuid[];
  v_sections uuid[] := '{}';
  v_finals uuid[] := '{}';
  v_attempts uuid[];
  n_progress integer := 0;
  n_attempts integer := 0;
  n_sessions integer := 0;
  n_seconds bigint := 0;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_lesson_id is not null then
    select course_id into v_course_id from lessons where id = p_lesson_id;
    if v_course_id is null then
      raise exception 'Lesson not found';
    end if;
    v_lessons := array[p_lesson_id];
  elsif p_course_id is not null then
    if not exists (select 1 from courses where id = p_course_id) then
      raise exception 'Course not found';
    end if;
    v_lessons := array(select id from lessons where course_id = p_course_id);
    v_sections := array(select id from sections where course_id = p_course_id);
    v_finals := array(select id from final_exams where course_id = p_course_id);
  else
    raise exception 'Pass a course or a lesson';
  end if;

  delete from progress where user_id = p_user_id and lesson_id = any(v_lessons);
  get diagnostics n_progress = row_count;

  v_attempts := array(
    select id from exam_attempts
    where user_id = p_user_id
      and (lesson_id = any(v_lessons) or section_id = any(v_sections) or final_exam_id = any(v_finals))
  );

  update progress set passing_attempt_id = null where passing_attempt_id = any(v_attempts);
  delete from final_exam_attempt_answers where attempt_id = any(v_attempts);
  delete from exam_attempt_answers where attempt_id = any(v_attempts);
  delete from exam_attempts where id = any(v_attempts);
  get diagnostics n_attempts = row_count;

  if p_reset_study_time then
    with moved as (
      delete from study_sessions
      where user_id = p_user_id
        and (lesson_id = any(v_lessons) or section_id = any(v_sections))
      returning *
    ), archived as (
      insert into study_sessions_archive
        (id, user_id, course_id, lesson_id, section_id, client_session_id, started_at, last_heartbeat_at, duration_seconds, archive_reason)
      select id, user_id, v_course_id, lesson_id, section_id, client_session_id, started_at, last_heartbeat_at, duration_seconds,
             case when p_lesson_id is null then 'course_reset' else 'lesson_reset' end
      from moved
      returning duration_seconds
    )
    select count(*), coalesce(sum(duration_seconds), 0) into n_sessions, n_seconds from archived;
  end if;

  return json_build_object(
    'lessons_reset', n_progress,
    'attempts_removed', n_attempts,
    'study_sessions_archived', n_sessions,
    'study_seconds_archived', n_seconds
  );
end;
$$;

-- Only the server may call this (it is called from /api/progress/reset
-- after verifying who the learner is).
revoke all on function reset_learning_progress(uuid, uuid, uuid, boolean) from public, anon, authenticated;

-- ============================================================
-- 3. Admin: lifetime study time per learner per course
-- ============================================================
-- current_seconds = what the learner currently sees; archived_seconds =
-- time they reset. Lifetime total = both.

create or replace function admin_study_time()
returns table (
  user_id uuid,
  email text,
  full_name text,
  course_id uuid,
  course_title text,
  current_seconds bigint,
  archived_seconds bigint,
  last_studied_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with live as (
    select s.user_id, coalesce(l.course_id, sec.course_id) as course_id,
           sum(s.duration_seconds)::bigint as secs, max(s.last_heartbeat_at) as last_at
    from study_sessions s
    left join lessons l on l.id = s.lesson_id
    left join sections sec on sec.id = s.section_id
    group by 1, 2
  ), arch as (
    select a.user_id, a.course_id, sum(a.duration_seconds)::bigint as secs, max(a.last_heartbeat_at) as last_at
    from study_sessions_archive a
    group by 1, 2
  ), combined as (
    select coalesce(live.user_id, arch.user_id) as user_id,
           coalesce(live.course_id, arch.course_id) as course_id,
           coalesce(live.secs, 0) as cur,
           coalesce(arch.secs, 0) as archd,
           greatest(live.last_at, arch.last_at) as last_at
    from live
    full outer join arch on live.user_id = arch.user_id and live.course_id is not distinct from arch.course_id
  )
  select c.user_id, p.email, p.full_name, c.course_id, co.title, c.cur, c.archd, c.last_at
  from combined c
  left join profiles p on p.id = c.user_id
  left join courses co on co.id = c.course_id
  where c.cur + c.archd > 0
  order by c.cur + c.archd desc;
$$;

revoke all on function admin_study_time() from public, anon, authenticated;
