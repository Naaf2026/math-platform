-- ============================================================
-- FAHI VISSNUN Math Learning Platform
-- Migration 0018
-- Class Analytics 3.0
-- ============================================================

-- Admin-only directory used by class management UI.
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
  select p.id,
         p.full_name,
         p.display_name,
         p.grade,
         p.learning_level,
         ur.role
    from public.profiles p
    join public.user_roles ur on ur.user_id = p.id
   where public.has_role('admin')
     and (p_role is null or ur.role = p_role)
   order by coalesce(nullif(p.display_name,''), nullif(p.full_name,''), '');
$$;

revoke all on function public.get_admin_user_directory(text) from public, anon;
grant execute on function public.get_admin_user_directory(text) to authenticated;


-- Secure class-wide student analytics for teachers/admins.
-- No answer text is exposed.
create or replace function public.get_class_roster_report(p_class_id bigint)
returns table(
  student_id uuid,
  display_name text,
  grade text,
  learning_level text,
  xp integer,
  current_streak integer,
  best_streak integer,
  total_questions bigint,
  total_correct bigint,
  accuracy integer,
  average_mastery integer,
  topics_explored bigint,
  missions_completed integer,
  best_combo integer,
  coins integer,
  gems integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not (
    public.has_role('admin')
    or public.is_class_teacher(p_class_id)
  ) then
    raise exception 'You are not authorized to view this class';
  end if;

  return query
  with roster as (
    select cm.student_id
      from public.class_members cm
     where cm.class_id = p_class_id
       and cm.status = 'active'
  ),
  tp as (
    select user_id,
           sum(questions_answered)::bigint as total_questions,
           sum(correct_answers)::bigint as total_correct,
           round(avg(coalesce(mastery,0)))::integer as average_mastery,
           count(*) filter (where questions_answered > 0)::bigint as topics_explored
      from public.topic_progress
     group by user_id
  )
  select p.id,
         coalesce(nullif(p.display_name,''), nullif(p.full_name,''), 'Student'),
         p.grade,
         p.learning_level,
         coalesce(p.xp,0),
         coalesce(p.current_streak,0),
         coalesce(p.best_streak,0),
         coalesce(tp.total_questions,0),
         coalesce(tp.total_correct,0),
         case when coalesce(tp.total_questions,0)=0
              then 0
              else round(tp.total_correct::numeric / tp.total_questions::numeric * 100)::integer
         end,
         coalesce(tp.average_mastery,0),
         coalesce(tp.topics_explored,0),
         coalesce(r.missions_completed,0),
         coalesce(r.best_combo,0),
         coalesce(r.coins,0),
         coalesce(r.gems,0)
    from roster ro
    join public.profiles p on p.id = ro.student_id
    left join tp on tp.user_id = p.id
    left join public.student_rewards r on r.user_id = p.id
   order by coalesce(nullif(p.display_name,''), nullif(p.full_name,''), '');
end;
$$;

revoke all on function public.get_class_roster_report(bigint) from public, anon;
grant execute on function public.get_class_roster_report(bigint) to authenticated;

-- Verification
select to_regprocedure('public.get_admin_user_directory(text)') as get_admin_user_directory;
select to_regprocedure('public.get_class_roster_report(bigint)') as get_class_roster_report;

-- ============================================================
-- END OF MIGRATION 0018
-- ============================================================
