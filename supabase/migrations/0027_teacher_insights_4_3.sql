-- ============================================================
-- FAHI VISSNUN Math Learning Platform
-- Migration 0027
-- Teacher Dashboard 4.3: progress & intervention insights
-- ============================================================

create or replace function public.get_teacher_insights(
  p_class_id bigint
)
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

  if not (
    public.has_role('admin')
    or public.is_class_teacher(p_class_id)
  ) then
    raise exception 'You are not authorized to view this class';
  end if;

  if not exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.status = 'active'
  ) then
    raise exception 'Class not found or inactive';
  end if;

  select jsonb_build_object(
    'class', (
      select jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'class_code', c.class_code,
        'grade', c.grade,
        'learning_level', c.learning_level
      )
      from public.classes c
      where c.id = p_class_id
    ),
    'summary', (
      select jsonb_build_object(
        'students', count(*),
        'active_learners_14d', count(*) filter (
          where exists (
            select 1
            from public.question_attempts qa
            where qa.user_id = cm.student_id
              and qa.created_at >= current_date - 13
          )
        ),
        'questions_14d', (
          select count(*)
          from public.question_attempts qa
          join public.class_members cm2
            on cm2.student_id = qa.user_id
           and cm2.class_id = p_class_id
           and cm2.status = 'active'
          where qa.created_at >= current_date - 13
        ),
        'accuracy_14d', (
          select case
            when count(*) = 0 then 0
            else round(
              count(*) filter (where qa.is_correct = true)::numeric
              / count(*)::numeric * 100
            )::integer
          end
          from public.question_attempts qa
          join public.class_members cm2
            on cm2.student_id = qa.user_id
           and cm2.class_id = p_class_id
           and cm2.status = 'active'
          where qa.created_at >= current_date - 13
        ),
        'open_interventions', (
          select count(*)
          from public.teacher_interventions ti
          where ti.class_id = p_class_id
            and ti.status = 'open'
        ),
        'completed_interventions', (
          select count(*)
          from public.teacher_interventions ti
          where ti.class_id = p_class_id
            and ti.status = 'completed'
        )
      )
      from public.class_members cm
      where cm.class_id = p_class_id
        and cm.status = 'active'
    ),
    'daily_activity', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'date', d.activity_date,
          'questions', coalesce((
            select count(*)
            from public.question_attempts qa
            join public.class_members cm
              on cm.student_id = qa.user_id
             and cm.class_id = p_class_id
             and cm.status = 'active'
            where qa.created_at >= d.activity_date::timestamptz
              and qa.created_at < (d.activity_date + interval '1 day')::timestamptz
          ), 0),
          'correct', coalesce((
            select count(*)
            from public.question_attempts qa
            join public.class_members cm
              on cm.student_id = qa.user_id
             and cm.class_id = p_class_id
             and cm.status = 'active'
            where qa.is_correct = true
              and qa.created_at >= d.activity_date::timestamptz
              and qa.created_at < (d.activity_date + interval '1 day')::timestamptz
          ), 0)
        ) order by d.activity_date
      ), '[]'::jsonb)
      from generate_series(
        current_date - 13,
        current_date,
        interval '1 day'
      ) as d(activity_date)
    ),
    'interventions', (
      select jsonb_build_object(
        'open', count(*) filter (where ti.status = 'open'),
        'completed', count(*) filter (where ti.status = 'completed'),
        'total', count(*),
        'completion_rate', case
          when count(*) = 0 then 0
          else round(
            count(*) filter (where ti.status = 'completed')::numeric
            / count(*)::numeric * 100
          )::integer
        end,
        'completed_with_followup', count(*) filter (
          where ti.status = 'completed'
            and exists (
              select 1
              from public.question_attempts qa
              where qa.user_id = ti.student_id
                and qa.created_at > ti.completed_at
                and qa.created_at <= ti.completed_at + interval '7 days'
            )
        )
      )
      from public.teacher_interventions ti
      where ti.class_id = p_class_id
    ),
    'support_topics', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'topic', topic_name,
          'count', intervention_count,
          'open', open_count,
          'completed', completed_count
        ) order by intervention_count desc, topic_name
      ), '[]'::jsonb)
      from (
        select coalesce(nullif(trim(ti.topic_id), ''), 'General support') as topic_name,
               count(*)::integer as intervention_count,
               count(*) filter (where ti.status = 'open')::integer as open_count,
               count(*) filter (where ti.status = 'completed')::integer as completed_count
        from public.teacher_interventions ti
        where ti.class_id = p_class_id
        group by coalesce(nullif(trim(ti.topic_id), ''), 'General support')
        order by count(*) desc, topic_name
        limit 8
      ) topics
    ),
    'attention', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'student_id', s.student_id,
          'student_name', s.student_name,
          'mastery', s.average_mastery,
          'accuracy', s.accuracy,
          'questions', s.total_questions,
          'open_interventions', s.open_interventions,
          'reason', case
            when s.open_interventions > 0 then 'Open intervention'
            when s.average_mastery < 60 or s.accuracy < 60 then 'Needs review'
            when s.total_questions = 0 then 'No recent practice'
            else 'Monitor progress'
          end
        ) order by
          case
            when s.open_interventions > 0 then 0
            when s.average_mastery < 60 or s.accuracy < 60 then 1
            when s.total_questions = 0 then 2
            else 3
          end,
          s.average_mastery asc,
          s.student_name
      ), '[]'::jsonb)
      from (
        select
          p.id as student_id,
          coalesce(nullif(p.display_name, ''), nullif(p.full_name, ''), 'Student') as student_name,
          coalesce(tp.average_mastery, 0)::integer as average_mastery,
          case
            when coalesce(tp.total_questions, 0) = 0 then 0
            else round(
              tp.total_correct::numeric
              / tp.total_questions::numeric * 100
            )::integer
          end as accuracy,
          coalesce((
            select count(*)
            from public.question_attempts qa
            where qa.user_id = p.id
              and qa.created_at >= current_date - 13
          ), 0)::integer as total_questions,
          coalesce((
            select count(*)
            from public.teacher_interventions ti
            where ti.class_id = p_class_id
              and ti.student_id = p.id
              and ti.status = 'open'
          ), 0)::integer as open_interventions
        from public.class_members cm
        join public.profiles p on p.id = cm.student_id
        left join (
          select
            user_id,
            sum(questions_answered)::bigint as total_questions,
            sum(correct_answers)::bigint as total_correct,
            round(avg(coalesce(mastery, 0)))::integer as average_mastery
          from public.topic_progress
          group by user_id
        ) tp on tp.user_id = p.id
        where cm.class_id = p_class_id
          and cm.status = 'active'
      ) s
    )
  ) into result;

  return result;
end;
$$;

revoke all
on function public.get_teacher_insights(bigint)
from public, anon;

grant execute
on function public.get_teacher_insights(bigint)
to authenticated;

select to_regprocedure(
  'public.get_teacher_insights(bigint)'
) as get_teacher_insights;

-- ============================================================
-- END OF MIGRATION 0027
-- ============================================================
