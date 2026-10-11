-- 0017: Course catalog stats and the admin overview.
--
-- course_catalog(): one call for the Courses page. For every published
-- course: its structure (domains with lesson counts and exam weights), size
-- (lessons, questions, practice exams, estimated minutes) and community
-- numbers (learners enrolled, learners active this week). Signed-in callers
-- also get their own enrollment and per-domain progress. Anyone can call it;
-- it never returns another learner's data.
--
-- admin_overview(): everything the admin page reports, service role only
-- (called from /api/admin/overview after checking the admin email).
--
-- Requires 0010-0016. Safe to re-run.

-- ============================================================
-- 1. Course catalog
-- ============================================================

create or replace function course_catalog()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as uid),
  c as (
    select co.* from courses co where co.published
  ), lesson_stats as (
    select l.course_id, l.section_id, count(*) as lessons,
           coalesce(sum(l.estimated_minutes), 0) as minutes,
           count(*) filter (where exists (
             select 1 from progress pr, me where pr.user_id = me.uid and pr.lesson_id = l.id
           )) as completed
    from lessons l
    where l.course_id in (select id from c)
    group by l.course_id, l.section_id
  ), question_stats as (
    select l.course_id, count(q.id) as questions
    from questions q join lessons l on l.id = q.lesson_id
    where l.course_id in (select id from c)
    group by l.course_id
  )
  select coalesce(json_agg(json_build_object(
    'id', c.id,
    'slug', c.slug,
    'title', c.title,
    'description', c.description,
    'category_id', c.category_id,
    'difficulty', c.difficulty,
    'provider', c.provider,
    'avg_training_time', c.avg_training_time,
    'lessons', coalesce((select sum(lessons) from lesson_stats ls where ls.course_id = c.id), 0),
    'minutes', coalesce((select sum(minutes) from lesson_stats ls where ls.course_id = c.id), 0)
               + coalesce((select questions from question_stats qs where qs.course_id = c.id), 0) * 0.75,
    'questions', coalesce((select questions from question_stats qs where qs.course_id = c.id), 0),
    'practice_exams', (select count(*) from final_exams fe where fe.course_id = c.id),
    'learners', (select count(*) from enrollments en where en.course_id = c.id),
    'active_week', (
      select count(distinct ss.user_id)
      from study_sessions ss
      left join lessons l on l.id = ss.lesson_id
      left join sections s on s.id = ss.section_id
      where coalesce(l.course_id, s.course_id) = c.id and ss.last_heartbeat_at > now() - interval '7 days'
    ),
    'enrolled', exists (select 1 from enrollments en, me where en.course_id = c.id and en.user_id = me.uid),
    'completed', coalesce((select sum(completed) from lesson_stats ls where ls.course_id = c.id), 0),
    'last_active', (
      select max(e.occurred_at) from learning_events e, me where e.user_id = me.uid and e.course_id = c.id
    ),
    'sections', coalesce((
      select json_agg(json_build_object(
        'title', s.title, 'weight', s.exam_weight_percent,
        'lessons', coalesce(ls.lessons, 0), 'completed', coalesce(ls.completed, 0)
      ) order by s.order_index)
      from sections s
      left join lesson_stats ls on ls.section_id = s.id
      where s.course_id = c.id and coalesce(ls.lessons, 0) > 0
    ), '[]'::json)
  ) order by c.title), '[]'::json)
  from c;
$$;

revoke all on function course_catalog() from public;
grant execute on function course_catalog() to anon, authenticated;

-- ============================================================
-- 2. Admin overview
-- ============================================================

create or replace function admin_overview()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with act as (
    select user_id, max(last_heartbeat_at) as last_seen
    from study_sessions group by user_id
  ), xp as (
    select user_id, sum(xp) as total_xp from learning_events group by user_id
  ), friend_counts as (
    select uid, count(*) as n
    from (
      select requester as uid from friendships where status = 'accepted'
      union all
      select addressee from friendships where status = 'accepted'
    ) x
    group by uid
  ), days as (
    select generate_series(
      (now() at time zone 'America/New_York')::date - 29,
      (now() at time zone 'America/New_York')::date,
      interval '1 day'
    )::date as d
  ), learner as (
    select p.id, p.full_name, p.email, p.created_at, p.display_name as alias, p.alias_confirmed,
           coalesce(p.show_on_leaderboards, true) as public, p.avatar, p.timezone,
           p.invited_by, p.invited_at,
           a.last_seen, coalesce(x.total_xp, 0) as total_xp, coalesce(fc.n, 0) as friends
    from profiles p
    left join act a on a.user_id = p.id
    left join xp x on x.user_id = p.id
    left join friend_counts fc on fc.uid = p.id
  )
  select json_build_object(
    'generated_at', now(),

    'learners', json_build_object(
      'total', (select count(*) from learner),
      'new_7d', (select count(*) from learner where created_at > now() - interval '7 days'),
      'new_30d', (select count(*) from learner where created_at > now() - interval '30 days'),
      'active_1d', (select count(*) from act where last_seen > now() - interval '1 day'),
      'active_7d', (select count(*) from act where last_seen > now() - interval '7 days'),
      'active_30d', (select count(*) from act where last_seen > now() - interval '30 days'),
      'ever_studied', (select count(*) from act),
      'study_seconds', (select coalesce(sum(duration_seconds), 0) from study_sessions)
                       + (select coalesce(sum(duration_seconds), 0) from study_sessions_archive),
      'lessons_completed', (select count(*) from learning_events where kind = 'lesson_completed'),
      'lessons_7d', (select count(*) from learning_events where kind = 'lesson_completed' and occurred_at > now() - interval '7 days'),
      'exam_attempts_7d', (select count(*) from learning_events where kind = 'exam_attempt' and occurred_at > now() - interval '7 days'),
      'xp_awarded', (select coalesce(sum(xp), 0) from learning_events)
    ),

    'daily', (
      select json_agg(json_build_object(
        'day', d,
        'signups', (select count(*) from profiles where (created_at at time zone 'America/New_York')::date = d),
        'active', (select count(distinct user_id) from study_sessions where (last_heartbeat_at at time zone 'America/New_York')::date = d),
        'lessons', (select count(*) from learning_events where kind = 'lesson_completed' and (occurred_at at time zone 'America/New_York')::date = d)
      ) order by d)
      from days
    ),

    'friends', json_build_object(
      'friendships', (select count(*) from friendships where status = 'accepted'),
      'pending', (select count(*) from friendships where status = 'pending'),
      'requests_sent', (select count(*) from friendships where source = 'request'),
      'requests_accepted', (select count(*) from friendships where source = 'request' and status = 'accepted'),
      'requests_7d', (select count(*) from friendships where source = 'request' and created_at > now() - interval '7 days'),
      'via_invite', (select count(*) from friendships where source = 'invite'),
      'learners_with_friends', (select count(*) from friend_counts),
      'avg_friends', (select round(avg(n), 1) from friend_counts),
      'most_connected', coalesce((
        select json_agg(t) from (
          select full_name, email, alias, friends, total_xp
          from learner where friends > 0 order by friends desc, total_xp desc limit 8
        ) t
      ), '[]'::json)
    ),

    'invites', json_build_object(
      'joined', (select count(*) from profiles where invited_by is not null),
      'joined_7d', (select count(*) from profiles where invited_at > now() - interval '7 days'),
      'qualified', (select count(*) from learning_events where kind = 'referral_bonus' and attempt_type = 'invitee'),
      'inviters', (select count(distinct invited_by) from profiles where invited_by is not null),
      'xp_awarded', (select coalesce(sum(xp), 0) from learning_events where kind = 'referral_bonus'),
      'top_inviters', coalesce((
        select json_agg(t) from (
          select i.full_name, i.email, i.alias,
                 count(*) as joined,
                 count(*) filter (where exists (
                   select 1 from learning_events e where e.user_id = j.id and e.kind = 'referral_bonus' and e.attempt_type = 'invitee'
                 )) as qualified
          from profiles j join learner i on i.id = j.invited_by
          group by i.id, i.full_name, i.email, i.alias
          order by joined desc, qualified desc
          limit 10
        ) t
      ), '[]'::json),
      'recent', coalesce((
        select json_agg(t) from (
          select j.full_name, j.email, j.display_name as alias, j.invited_at,
                 i.full_name as inviter_name, i.display_name as inviter_alias,
                 exists (
                   select 1 from learning_events e where e.user_id = j.id and e.kind = 'referral_bonus' and e.attempt_type = 'invitee'
                 ) as qualified
          from profiles j join profiles i on i.id = j.invited_by
          order by j.invited_at desc nulls last
          limit 15
        ) t
      ), '[]'::json)
    ),

    'features', json_build_object(
      'alias_confirmed', (select count(*) from learner where alias_confirmed),
      'hidden', (select count(*) from learner where not public),
      'avatar_chosen', (select count(*) from learner where avatar is not null),
      'top_avatars', coalesce((
        select json_agg(t) from (
          select avatar, count(*) as n from learner where avatar is not null
          group by avatar order by n desc limit 8
        ) t
      ), '[]'::json),
      'notes', (select count(*) from notes),
      'note_takers', (select count(distinct user_id) from notes),
      'streak_active', (
        select count(*) from learner l
        where l.last_seen > now() - interval '3 days'
          and (select s.current_streak from streak_for(l.id, safe_tz(l.timezone)) s) > 0
      ),
      'levels', (
        select json_agg(json_build_object('label', label, 'n', n) order by ord) from (
          select case when lv = 1 then 'Level 1' when lv < 5 then 'Levels 2-4' when lv < 10 then 'Levels 5-9'
                      when lv < 20 then 'Levels 10-19' else 'Level 20+' end as label,
                 min(lv) as ord, count(*) as n
          from (select level_for_xp(total_xp) as lv from learner) z
          group by 1
        ) b
      ),
      'located_sessions_7d', (select count(*) from study_sessions where country is not null and last_heartbeat_at > now() - interval '7 days'),
      'sessions_7d', (select count(*) from study_sessions where last_heartbeat_at > now() - interval '7 days')
    ),

    'courses', coalesce((
      select json_agg(t order by t.enrolled desc, t.title) from (
        select co.id, co.title, co.published,
               (select count(*) from lessons l where l.course_id = co.id) as lessons,
               (select count(*) from enrollments en where en.course_id = co.id) as enrolled,
               (select count(distinct ss.user_id) from study_sessions ss
                  left join lessons l on l.id = ss.lesson_id
                  left join sections s on s.id = ss.section_id
                  where coalesce(l.course_id, s.course_id) = co.id
                    and ss.last_heartbeat_at > now() - interval '7 days') as active_7d,
               (select count(*) from learning_events e
                  where e.course_id = co.id and e.kind = 'lesson_completed'
                    and e.occurred_at > now() - interval '7 days') as lessons_7d,
               (select round(avg(done::numeric / nullif(total, 0)) * 100)
                  from (
                    select en.user_id,
                           (select count(*) from progress pr join lessons l on l.id = pr.lesson_id
                              where pr.user_id = en.user_id and l.course_id = co.id) as done,
                           (select count(*) from lessons l where l.course_id = co.id) as total
                    from enrollments en where en.course_id = co.id
                  ) z) as avg_progress,
               (select count(*) from (
                  select en.user_id from enrollments en
                  where en.course_id = co.id
                    and (select count(*) from lessons l where l.course_id = co.id) > 0
                    and (select count(*) from progress pr join lessons l on l.id = pr.lesson_id
                           where pr.user_id = en.user_id and l.course_id = co.id)
                        = (select count(*) from lessons l where l.course_id = co.id)
                ) z) as finished
        from courses co
      ) t
    ), '[]'::json),

    'learner_list', coalesce((
      select json_agg(t) from (
        select l.full_name, l.email, l.alias, l.public, l.avatar, l.created_at, l.last_seen,
               l.total_xp, level_for_xp(l.total_xp) as level, l.friends,
               (select display_name from profiles where id = l.invited_by) as invited_by,
               (select count(*) from enrollments en where en.user_id = l.id) as courses,
               (select count(*) from learning_events e where e.user_id = l.id and e.kind = 'lesson_completed') as lessons
        from learner l
        order by coalesce(l.last_seen, l.created_at) desc
        limit 100
      ) t
    ), '[]'::json)
  );
$$;

revoke all on function admin_overview() from public, anon, authenticated;
