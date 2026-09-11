-- ============================================================
-- FAHI VISSNUN Math Learning Platform
-- Migration 0023
-- Admin user-role reconciliation
-- ============================================================
-- Existing profiles can pre-date the role system. Do not infer
-- a role from learning activity; expose unassigned accounts to
-- administrators so each account can be explicitly classified.

create or replace function public.get_admin_user_directory(p_role text default null)
returns table(
  id uuid,
  full_name text,
  display_name text,
  grade text,
  learning_level text,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.display_name,
    p.grade,
    p.learning_level,
    coalesce(ur.role, 'unassigned') as role
  from public.profiles p
  left join public.user_roles ur
    on ur.user_id = p.id
  where public.has_role('admin')
    and (
      p_role is null
      or (p_role = 'unassigned' and ur.user_id is null)
      or ur.role = p_role
    )
  order by
    case when ur.role is null then 0 else 1 end,
    coalesce(nullif(p.display_name,''), nullif(p.full_name,''), '');
$$;

revoke all on function public.get_admin_user_directory(text) from public, anon;
grant execute on function public.get_admin_user_directory(text) to authenticated;

create or replace function public.get_admin_dashboard_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role('admin') then
    raise exception 'Administrator access is required';
  end if;

  select jsonb_build_object(
    'users', jsonb_build_object(
      'total', (select count(*) from public.profiles),
      'students', (select count(*) from public.user_roles where role = 'student'),
      'teachers', (select count(*) from public.user_roles where role = 'teacher'),
      'parents', (select count(*) from public.user_roles where role in ('parent','guardian')),
      'admins', (select count(*) from public.user_roles where role = 'admin'),
      'unassigned', (
        select count(*)
        from public.profiles p
        left join public.user_roles ur on ur.user_id = p.id
        where ur.user_id is null
      )
    ),

    'classes', jsonb_build_object(
      'total', (select count(*) from public.classes),
      'active', (select count(*) from public.classes where status = 'active'),
      'archived', (select count(*) from public.classes where status = 'archived'),
      'enrolments', (select count(*) from public.class_members where status = 'active'),
      'teachers_assigned', (select count(*) from public.class_teachers where status = 'active')
    ),

    'learning', jsonb_build_object(
      'active_learners_7d', (
        select count(distinct qa.user_id)
        from public.question_attempts qa
        where qa.created_at >= current_date - 6
      ),
      'learning_days_30d', (
        select count(*)
        from (
          select distinct qa.user_id, qa.created_at::date as activity_date
          from public.question_attempts qa
          where qa.created_at >= current_date - 29
        ) activity_days
      ),
      'questions_answered', (select count(*) from public.question_attempts),
      'correct_answers', (
        select count(*) from public.question_attempts where is_correct = true
      ),
      'lessons_completed', (
        select count(*) from public.lesson_progress where completed_at is not null
      ),
      'topics_completed', (
        select count(*) from public.topic_progress where completed_at is not null
      ),
      'xp_total', (select coalesce(sum(xp), 0) from public.profiles),
      'average_streak', (
        select coalesce(round(avg(current_streak)), 0) from public.profiles
      )
    ),

    'recent_activity', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'date', d.activity_date,
            'learners', (
              select count(distinct qa.user_id)
              from public.question_attempts qa
              where qa.created_at >= d.activity_date::timestamptz
                and qa.created_at < (d.activity_date + interval '1 day')::timestamptz
            ),
            'questions', (
              select count(*)
              from public.question_attempts qa
              where qa.created_at >= d.activity_date::timestamptz
                and qa.created_at < (d.activity_date + interval '1 day')::timestamptz
            )
          )
          order by d.activity_date
        ),
        '[]'::jsonb
      )
      from generate_series(
        current_date - 6,
        current_date,
        interval '1 day'
      ) as d(activity_date)
    ),

    'top_students', (
      select coalesce(
        jsonb_agg(
          to_jsonb(t)
          order by t.xp desc, t.questions desc
        ),
        '[]'::jsonb
      )
      from (
        select
          p.id,
          coalesce(
            nullif(p.display_name, ''),
            nullif(p.full_name, ''),
            'Student'
          ) as name,
          p.grade,
          coalesce(p.xp, 0) as xp,
          coalesce(p.current_streak, 0) as streak,
          count(qa.id)::integer as questions,
          count(*) filter (where qa.is_correct = true)::integer as correct,
          case
            when count(qa.id) = 0 then 0
            else round(
              count(*) filter (where qa.is_correct = true)::numeric
              / count(qa.id)::numeric * 100
            )::integer
          end as accuracy
        from public.profiles p
        join public.user_roles ur
          on ur.user_id = p.id
         and ur.role = 'student'
        left join public.question_attempts qa
          on qa.user_id = p.id
        group by
          p.id,
          p.display_name,
          p.full_name,
          p.grade,
          p.xp,
          p.current_streak
        order by
          coalesce(p.xp, 0) desc,
          count(qa.id) desc
        limit 5
      ) t
    )
  )
  into result;

  return result;
end;
$$;

revoke all on function public.get_admin_dashboard_analytics() from public, anon;
grant execute on function public.get_admin_dashboard_analytics() to authenticated;

-- Verification
select to_regprocedure('public.get_admin_user_directory(text)') as get_admin_user_directory;
select to_regprocedure('public.get_admin_dashboard_analytics()') as get_admin_dashboard_analytics;

-- ============================================================
-- END OF MIGRATION 0023
-- ============================================================
