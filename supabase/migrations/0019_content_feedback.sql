-- 0019: Content feedback ("Report a problem").
--
-- Learners can flag a lesson slide, a quiz/checkpoint/practice-exam
-- question, a results explanation or a whole course. Reports are written by
-- /api/feedback (service role), which also emails the admin. Learners can
-- read their own reports; only the admin (service role) sees everything and
-- updates status.
--
-- A snapshot of what was on screen (slide text or question text) is kept
-- with each report, so it still makes sense after the content is edited.
--
-- Safe to re-run.

create table if not exists content_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  context text not null check (context in ('lesson', 'mini_exam', 'checkpoint', 'final_exam', 'results', 'course')),
  category text not null check (category in ('wrong', 'unclear', 'typo', 'broken', 'suggestion', 'other')),
  message text,
  course_id uuid references courses(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  section_id uuid references sections(id) on delete set null,
  final_exam_id uuid,
  question_id uuid,          -- lesson/checkpoint question or practice-exam question
  block_index integer,       -- which slide of the lesson (0-based)
  snapshot text,             -- the slide or question text at the time
  page_path text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'fixed', 'wont_fix')),
  admin_note text,
  resolved_at timestamptz,
  emailed boolean not null default false
);

create index if not exists content_feedback_created_idx on content_feedback (created_at desc);
create index if not exists content_feedback_status_idx on content_feedback (status, created_at desc);
create index if not exists content_feedback_user_idx on content_feedback (user_id, created_at desc);
create index if not exists content_feedback_question_idx on content_feedback (question_id);

alter table content_feedback enable row level security;

drop policy if exists "learners read their own feedback" on content_feedback;
create policy "learners read their own feedback"
  on content_feedback for select
  using (user_id = auth.uid());
-- Inserts and updates go through the server (service role) only.
