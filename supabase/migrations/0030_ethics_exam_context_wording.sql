-- Professional Ethics (CISSP Domain 1): the "How this shows up on the
-- exam" text had ***most correct*** (rendered with stray asterisks and
-- narrated as "asterisk") and a comma splice left over from the dash
-- cleanup. Same meaning, cleaner wording.
update lessons
set content_blocks = jsonb_set(
  content_blocks,
  '{0,examContext}',
  to_jsonb('Ethics questions are almost always scenario-based: you''re given a workplace dilemma and asked for the **most correct** action under the Code, not just what sounds reasonable. ISC2 specifically tests canon precedence: when two canons seem to conflict, the lower-numbered (earlier-listed) canon wins. Expect a small but consistent handful of ethics questions across the exam, and at least one that expects you to recognize an RFC 1087-style ''unacceptable activity'' from a described scenario.'::text)
)
where id = 'ef1131a7-9cee-4a84-b6b0-309502a86251'
  and content_blocks->0->>'type' = 'title';
