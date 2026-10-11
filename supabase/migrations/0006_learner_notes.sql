-- Learner notes: private notes a learner writes or saves from lessons.
-- A note can be linked to a lesson (and its course) or stand on its own.
-- Safe to re-run.

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  body text not null default '',
  quote text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_updated_idx on notes (user_id, updated_at desc);
create index if not exists notes_user_lesson_idx on notes (user_id, lesson_id);

alter table notes enable row level security;

-- Each learner can only ever see and change their own notes.
drop policy if exists "notes are private to their owner" on notes;
create policy "notes are private to their owner"
  on notes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function notes_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_touch_updated_at on notes;
create trigger notes_touch_updated_at
  before update on notes
  for each row execute function notes_touch_updated_at();
