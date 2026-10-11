-- Adds a "How to Use Orivian" lesson to the NICET Special Hazards Level I
-- course's Getting Started section (every other course already has one).
-- It goes right after "What the Level I Exam Looks Like", matching the
-- other courses. Safe to re-run: does nothing if the lesson already exists.

do $$
declare
  nicet_course uuid := 'a0c1daa7-2434-413e-b008-37e5500fbce2';
  getting_started uuid := '40702086-9471-416b-9c06-09e6338b97f2';
begin
  if exists (select 1 from lessons where course_id = nicet_course and title = 'How to Use Orivian') then
    raise notice 'NICET already has How to Use Orivian - nothing to do.';
    return;
  end if;

  -- Make room at position 3 (two steps so a unique order constraint can't trip).
  update lessons set order_index = order_index + 1000 where course_id = nicet_course and order_index >= 3;
  update lessons set order_index = order_index - 999 where course_id = nicet_course and order_index >= 1000;

  insert into lessons (id, course_id, section_id, title, order_index, lesson_type, estimated_minutes, summary, content_blocks)
  values (
    gen_random_uuid(),
    nicet_course,
    getting_started,
    'How to Use Orivian',
    3,
    'orientation',
    5,
    'How **lessons**, **mini-exams**, **recaps**, **checkpoints**, and **notes** fit together on this platform.',
    $blocks$[
  {
    "type": "title",
    "text": "How to Use Orivian",
    "overview": "How a task area's lessons, recap, and checkpoint fit together, what it takes to mark a lesson complete, and the tools that help you study.",
    "examContext": "Why this matters: understanding the platform's rhythm up front means you spend your time studying, not figuring out the interface."
  },
  {
    "type": "group",
    "blocks": [
      {
        "type": "paragraph",
        "text": "This course follows the five **task areas** of the NICET Special Hazards Systems Level I content outline. Each task area is broken into focused **lessons**. A lesson opens with a short overview, walks through a few content slides, then ends with a **10-question mini-exam**. You need **80% (8 of 10) to pass** and mark the lesson complete - if you don't, review the content and retake it."
      },
      {
        "type": "list",
        "style": "bullet",
        "items": [
          "**Lesson** - content slides + a 10-question mini-exam, 80% to pass.",
          "**Task Area Recap** - a no-exam review pulling the highest-yield facts from every lesson in the task area. Read it, mark it reviewed.",
          "**Task Area Checkpoint** - a longer exam with fresh questions from across the whole task area, checking whether the material stuck.",
          "**Practice Exams** - full-length practice tests spanning every task area, for when you are close to exam day."
        ]
      }
    ]
  },
  {
    "type": "callout",
    "variant": "info",
    "text": "A live **study timer** (today's session + your running total) tracks your time on this course automatically, visible in the lesson player and on your profile page. It only counts time actually spent reading or testing - not idle browser tabs."
  },
  {
    "type": "group",
    "heading": "Your Notes",
    "blocks": [
      {
        "type": "paragraph",
        "text": "Every lesson has a **📝 Notes** button in the top-right corner. Use it for mnemonics, questions, or anything you want to come back to. Notes are private to you and follow your account to any device."
      },
      {
        "type": "list",
        "style": "bullet",
        "items": [
          "**Write a note** - open the Notes panel in any lesson and type. The note is linked to that lesson automatically.",
          "**Save to notes** - select any sentence or key term in a lesson and tap **Save to notes** to keep it as a quote, then add your own thoughts underneath.",
          "**My Notes** - everything you have saved lives on the **Notes** page in the top menu, grouped by course and lesson. Search it, filter by course, or add general notes that are not tied to a lesson."
        ]
      }
    ]
  }
]$blocks$::jsonb
  );
end $$;

-- Check: Getting Started should list 4 lessons in this order.
select l.order_index, l.title
from lessons l
where l.section_id = '40702086-9471-416b-9c06-09e6338b97f2'
order by l.order_index;
