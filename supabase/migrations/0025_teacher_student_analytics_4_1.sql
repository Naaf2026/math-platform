-- ============================================================
-- FAHI VISSNUN Math Learning Platform
-- Migration 0025
-- Teacher Dashboard 4.1: secure individual learner analytics
-- ============================================================

create or replace function public.get_teacher_student_detail(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  v_allowed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.has_role('admin') then
    v_allowed := true;
  elsif public.has_role('teacher') then
    select exists (
      select 1
      from public.class_members cm
      join public.class_teachers ct
        on ct.class_id = cm.class_id
       and ct.teacher_id = auth.uid()
       and ct.status = 'active'
      where cm.student_id = p_student_id
        and cm.status = 'active'
    ) into v_allowed;
  end if;

  if not v_allowed then
    raise exception 'You are not authorized to view this learner';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_student_id
  ) then
    raise exception 'Student profile not found';
  end if;

  select jsonb_build_object(
    'profile', (
      select jsonb_build_object(
        'id', p.id,
        'name', coalesce(nullif(p.display_name,''), nullif(p.full_name,''), 'Student'),
        'full_name', p.full_name,
        'grade', p.grade,
        'learning_level', p.learning_level,
        'xp', coalesce(p.xp,0),
        'current_streak', coalesce(p.current_streak,0),
        'best_streak', coalesce(p.best_streak,0)
      )
      from public.profiles p
      where p.id = p_student_id
    ),

    'classes', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'class_code', c.class_code,
          'grade', c.grade,
          'learning_level', c.learning_level
        ) order by c.name
      ), '[]'::jsonb)
      from public.classes c
      join public.class_members cm
        on cm.class_id = c.id
       and cm.student_id = p_student_id
       and cm.status = 'active'
      where c.status = 'active'
        and (
          public.has_role('admin')
          or public.is_class_teacher(c.id)
        )
    ),

    'overall', (
      select jsonb_build_object(
        'questions', count(*)::integer,
        'correct', count(*) filter (where qa.is_correct = true)::integer,
        'accuracy', case
          when count(*) = 0 then 0
          else round(
            count(*) filter (where qa.is_correct = true)::numeric
            / count(*)::numeric * 100
          )::integer
        end,
        'active_days_30d', count(distinct qa.created_at::date) filter (
          where qa.created_at >= current_date - 29
        ),
        'last_activity', max(qa.created_at)
      )
      from public.question_attempts qa
      where qa.user_id = p_student_id
    ),

    'lessons', (
      select jsonb_build_object(
        'completed', count(*) filter (where completed_at is not null)::integer,
        'total', count(*)::integer
      )
      from public.lesson_progress
      where user_id = p_student_id
    ),

    'topics', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'topic_id', tp.topic_id,
          'questions', coalesce(tp.questions_answered,0),
          'correct', coalesce(tp.correct_answers,0),
          'accuracy', case
            when coalesce(tp.questions_answered,0) = 0 then 0
            else round(
              tp.correct_answers::numeric
              / tp.questions_answered::numeric * 100
            )::integer
          end,
          'mastery', coalesce(tp.mastery,0),
          'completed', tp.completed_at is not null
        ) order by coalesce(tp.mastery,0) asc, tp.topic_id
      ), '[]'::jsonb)
      from public.topic_progress tp
      where tp.user_id = p_student_id
    ),

    'recent_activity', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'date', d.activity_date,
          'questions', (
            select count(*)
            from public.question_attempts qa
            where qa.user_id = p_student_id
              and qa.created_at >= d.activity_date::timestamptz
              and qa.created_at < (d.activity_date + interval '1 day')::timestamptz
          ),
          'correct', (
            select count(*)
            from public.question_attempts qa
            where qa.user_id = p_student_id
              and qa.is_correct = true
              and qa.created_at >= d.activity_date::timestamptz
              and qa.created_at < (d.activity_date + interval '1 day')::timestamptz
          )
        ) order by d.activity_date
      ), '[]'::jsonb)
      from generate_series(
        current_date - 6,
        current_date,
        interval '1 day'
      ) as d(activity_date)
    ),

    'rewards', (
      select jsonb_build_object(
        'missions_completed', coalesce(r.missions_completed,0),
        'best_combo', coalesce(r.best_combo,0),
        'coins', coalesce(r.coins,0),
        'gems', coalesce(r.gems,0)
      )
      from public.student_rewards r
      where r.user_id = p_student_id
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_teacher_student_detail(uuid) from public, anon;
grant execute on function public.get_teacher_student_detail(uuid) to authenticated;

select to_regprocedure('public.get_teacher_student_detail(uuid)') as get_teacher_student_detail;

-- ============================================================
-- END OF MIGRATION 0025
-- ============================================================
