-- CISSP content model: sections, structured lesson content, exam questions,
-- exam attempts, completion dates, and computed mastery/decay scoring.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE throughout.

-- ============================================================
-- 1. sections (Course -> Section -> Lesson)
-- ============================================================

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  order_index int not null default 0,
  exam_weight_percent numeric,
  created_at timestamptz not null default now(),
  unique (course_id, slug)
);

alter table sections enable row level security;

drop policy if exists "sections are publicly readable" on sections;
create policy "sections are publicly readable"
  on sections for select
  using (true);

-- ============================================================
-- 2. lessons: add section_id, structured content, time estimate
-- ============================================================

alter table lessons
  add column if not exists section_id uuid references sections(id) on delete cascade,
  add column if not exists estimated_minutes int,
  add column if not exists content_blocks jsonb not null default '[]'::jsonb;

create index if not exists lessons_section_id_idx on lessons (section_id);

-- ============================================================
-- 3. questions (mini-exam + retentive-review question bank)
--    NOT client-readable: correct_choice_ids must never reach the
--    browser before an answer is submitted. Only the server-side
--    exam API (using the service role key) reads this table.
-- ============================================================

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  section_id uuid references sections(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'single' check (question_type in ('single', 'multi')),
  choices jsonb not null,                 -- [{ "id": "a", "text": "..." }, ...]
  correct_choice_ids jsonb not null,      -- ["a"] or ["a","c"]
  explanation text,
  created_at timestamptz not null default now(),
  check (lesson_id is not null or section_id is not null)
);

create index if not exists questions_lesson_id_idx on questions (lesson_id);
create index if not exists questions_section_id_idx on questions (section_id);

alter table questions enable row level security;

-- Intentionally no select policy for anon/authenticated roles.
-- Only the service-role key (server-side exam API) can read this table.

-- ============================================================
-- 4. exam_attempts + exam_attempt_answers
-- ============================================================

create table if not exists exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  section_id uuid references sections(id) on delete cascade,
  attempt_type text not null check (attempt_type in ('mini_exam', 'retentive_review')),
  question_count int not null,
  score_percent numeric not null,
  passed boolean not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  check (lesson_id is not null or section_id is not null)
);

create index if not exists exam_attempts_user_id_idx on exam_attempts (user_id);
create index if not exists exam_attempts_lesson_id_idx on exam_attempts (lesson_id);
create index if not exists exam_attempts_section_id_idx on exam_attempts (section_id);

alter table exam_attempts enable row level security;

drop policy if exists "users read own exam attempts" on exam_attempts;
create policy "users read own exam attempts"
  on exam_attempts for select
  using (auth.uid() = user_id);

-- No insert/update policy for client roles: attempts are only ever
-- written by the server-side grading route via the service role key,
-- so a user can't POST a fake "passed" attempt directly to Supabase.

create table if not exists exam_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references exam_attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  selected_choice_ids jsonb not null,
  correct boolean not null
);

create index if not exists exam_attempt_answers_attempt_id_idx on exam_attempt_answers (attempt_id);

alter table exam_attempt_answers enable row level security;

drop policy if exists "users read own exam attempt answers" on exam_attempt_answers;
create policy "users read own exam attempt answers"
  on exam_attempt_answers for select
  using (
    exists (
      select 1 from exam_attempts
      where exam_attempts.id = exam_attempt_answers.attempt_id
      and exam_attempts.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. progress: completion date + which attempt passed it
-- ============================================================

alter table progress
  add column if not exists completed_at timestamptz not null default now(),
  add column if not exists passing_attempt_id uuid references exam_attempts(id);

-- ============================================================
-- 6. Computed mastery/decay scoring
--    Nothing here is stored — it's evaluated fresh every call so
--    completed_at history is never rewritten, only the *current*
--    mastery reading changes as time passes.
-- ============================================================

create or replace function section_last_verified_at(p_user_id uuid, p_section_id uuid)
returns timestamptz
language sql
stable
as $$
  select greatest(
    (select max(progress.completed_at)
       from progress
       join lessons on lessons.id = progress.lesson_id
       where progress.user_id = p_user_id
         and lessons.section_id = p_section_id),
    (select max(exam_attempts.completed_at)
       from exam_attempts
       where exam_attempts.user_id = p_user_id
         and exam_attempts.section_id = p_section_id
         and exam_attempts.attempt_type = 'retentive_review'
         and exam_attempts.passed = true)
  )
$$;

-- Tunables: 14-day grace period, -2%/day after that, floor at 60%.
create or replace function section_mastery(p_user_id uuid, p_section_id uuid)
returns table (
  lessons_total int,
  lessons_completed int,
  base_percent numeric,
  mastery_percent numeric,
  last_verified_at timestamptz,
  days_overdue int,
  review_due boolean
)
language sql
stable
as $$
  with lesson_counts as (
    select
      count(*) as total,
      count(*) filter (
        where exists (
          select 1 from progress
          where progress.user_id = p_user_id
          and progress.lesson_id = lessons.id
        )
      ) as completed
    from lessons
    where lessons.section_id = p_section_id
  ),
  verified as (
    select section_last_verified_at(p_user_id, p_section_id) as at
  )
  select
    lesson_counts.total,
    lesson_counts.completed,
    case when lesson_counts.total = 0 then 0
      else round(100.0 * lesson_counts.completed / lesson_counts.total, 1)
    end as base_percent,
    case
      when lesson_counts.total = 0 or lesson_counts.completed < lesson_counts.total then
        case when lesson_counts.total = 0 then 0
          else round(100.0 * lesson_counts.completed / lesson_counts.total, 1)
        end
      when verified.at is null or now() - verified.at <= interval '14 days' then 100
      else greatest(60, 100 - (extract(day from (now() - verified.at)) - 14) * 2)
    end as mastery_percent,
    verified.at as last_verified_at,
    case
      when lesson_counts.total > 0 and lesson_counts.completed = lesson_counts.total
        and verified.at is not null and now() - verified.at > interval '14 days'
      then greatest(0, floor(extract(day from (now() - verified.at)) - 14))::int
      else 0
    end as days_overdue,
    (
      lesson_counts.total > 0 and lesson_counts.completed = lesson_counts.total
      and (verified.at is null or now() - verified.at > interval '14 days')
    ) as review_due
  from lesson_counts, verified
$$;

-- Course-level mastery: average of its sections' live mastery.
create or replace function course_mastery(p_user_id uuid, p_course_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(round(avg(m.mastery_percent), 1), 0)
  from sections
  cross join lateral section_mastery(p_user_id, sections.id) m
  where sections.course_id = p_course_id
$$;
