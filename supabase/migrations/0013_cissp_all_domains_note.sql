-- CISSP "What the CISSP Exam Actually Tests": replace the outdated note that
-- said only Domains 1-3 were available. All eight domains are now complete.
-- Safe to re-run: only changes the note if it still has the old wording.

update lessons
set content_blocks = jsonb_set(
  content_blocks,
  '{2,blocks,1,text}',
  to_jsonb('Orivian covers all eight domains in full - each with its own lessons, a domain recap, and a full-domain checkpoint - plus four full-length practice exams that span every domain. Use the weights above to decide where to spend your time: Domain 1 alone is about a sixth of the exam.'::text)
)
where id = '4ccfafb6-984b-4540-a379-732d84cd14b1'
  and content_blocks #>> '{2,blocks,1,text}' like 'Orivian currently covers%';

-- Check: should show the new wording.
select content_blocks #>> '{2,blocks,1,text}' as note
from lessons
where id = '4ccfafb6-984b-4540-a379-732d84cd14b1';
