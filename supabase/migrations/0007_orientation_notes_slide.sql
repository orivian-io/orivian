-- Adds a "Your Notes" slide to every course's "How to Use Orivian" lesson.
-- Safe to re-run: lessons that already mention "Save to notes" are skipped.

-- CISSP: insert before the closing study tip (keeps the tip as the last slide).
update lessons
set content_blocks = jsonb_insert(content_blocks, '{5}', $notes${
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
}$notes$::jsonb)
where id = 'fc67d528-1b18-4731-a607-02d5a2e38833'
  and content_blocks::text not like '%Save to notes%';

-- A+ Core 1 & 2, CySA+, IT Fundamentals, Network+, Security+: add as the last slide.
update lessons
set content_blocks = content_blocks || jsonb_build_array($notes${
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
}$notes$::jsonb)
where id in ('85465fe6-5f26-4b21-92ff-19f082a62300', 'a25672d1-0bd8-473f-8f68-5f37e61234c7', '62400032-1d81-4dc3-8782-1ae726061ef3', 'a6ae551c-d2bd-4a25-b2ea-495ea46c6e7d', 'e7703cd8-1777-475f-b5be-626bf9d2a64e', 'b648dcf9-7ca8-463b-92d7-54c833139502')
  and content_blocks::text not like '%Save to notes%';

-- Check: every row should show has_notes_slide = true.
select c.title as course, l.title, jsonb_array_length(l.content_blocks) as slides,
       l.content_blocks::text like '%Save to notes%' as has_notes_slide
from lessons l join courses c on c.id = l.course_id
where l.title = 'How to Use Orivian'
order by c.title;
