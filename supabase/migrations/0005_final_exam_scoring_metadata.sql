-- Makes Final Exam scoring data-driven per exam instead of hardcoded for
-- CISSP in app/api/final-exams/submit/route.ts. Adds two nullable columns
-- to final_exams; backfills the 4 existing CISSP practice exams with the
-- exact values/text that route currently hardcodes, so CISSP behavior is
-- unchanged. Any new course's final exams (e.g. Security+) supply their
-- own values going forward - no code change needed for the next course.
alter table final_exams
  add column if not exists pass_threshold_percent integer not null default 70,
  add column if not exists scoring_disclaimer text;

update final_exams
set scoring_disclaimer = 'This score is a straight percentage of questions answered correctly. The real CISSP exam uses adaptive testing (CAT) and a scaled 700/1000 passing score from an item bank calibrated by ISC2 - this practice exam approximates but can''t reproduce that model, so treat this result as a strong directional signal, not an exact prediction.'
where course_id = (select id from courses where slug = 'cissp')
and scoring_disclaimer is null;

-- pass_threshold_percent already defaults to 70, matching CISSP's existing
-- hardcoded threshold, so no update needed for the CISSP rows there.
