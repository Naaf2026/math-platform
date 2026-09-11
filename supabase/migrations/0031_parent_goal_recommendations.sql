-- ============================================================
-- 0031_parent_goal_recommendations.sql
-- Parent Dashboard — Automatic Learning Goal Recommendations
-- ============================================================

create or replace function public.get_parent_goal_recommendations(
  p_student_id uuid
)
returns table(
  recommendation_id text,
  goal_type text,
  title text,
  description text,
  target_value numeric,
  topic_title text,
  reason text,
  priority integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
      from public.student_relationships sr
     where sr.student_id = p_student_id
       and sr.related_user_id = auth.uid()
       and sr.relationship in ('parent','guardian')
       and sr.status = 'active'
  ) then
    raise exception 'Student is not linked to this parent account';
  end if;

  return query
  with topic_data as (
    select
      t.topic_id,
      t.topic_title,
      coalesce(t.mastery, 0)::numeric as mastery,
      coalesce(t.questions_answered, 0)::numeric as questions_answered
    from public.get_linked_student_topics(p_student_id) t
  ),
  active_goals as (
    select lower(coalesce(g.topic_title,'')) as topic_title
    from public.parent_learning_goals g
    where g.student_id = p_student_id
      and g.status = 'active'
  ),
  weak_topics as (
    select
      td.*,
      row_number() over (order by td.mastery asc, td.questions_answered asc, td.topic_title asc) as rn
    from topic_data td
    where td.topic_title is not null
      and not exists (
        select 1
        from active_goals ag
        where ag.topic_title = lower(td.topic_title)
      )
  ),
  topic_recommendations as (
    select
      'topic-' || coalesce(wt.topic_id::text, md5(wt.topic_title)) as recommendation_id,
      'questions'::text as goal_type,
      ('Practice ' || wt.topic_title)::text as title,
      case
        when wt.mastery < 50 then ('Build confidence in ' || wt.topic_title || ' with focused practice.')
        when wt.mastery < 70 then ('Strengthen ' || wt.topic_title || ' with a short targeted practice set.')
        else ('Keep improving ' || wt.topic_title || ' with regular practice.')
      end::text as description,
      case when wt.mastery < 50 then 20 else 15 end::numeric as target_value,
      wt.topic_title::text,
      ('Current mastery is ' || round(wt.mastery)::text || '%. This is one of the learner''s areas with the most room to improve.')::text as reason,
      case when wt.mastery < 50 then 1 else 2 end::integer as priority
    from weak_topics wt
    where wt.rn <= 2
      and wt.mastery < 80
  ),
  overall_accuracy as (
    select coalesce(
      round(
        count(*) filter (where qa.is_correct)::numeric
        / nullif(count(*)::numeric, 0) * 100
      , 0),
      0
    )::numeric as accuracy
    from public.question_attempts qa
    where qa.user_id = p_student_id
  ),
  accuracy_recommendation as (
    select
      'accuracy-overall'::text,
      'accuracy'::text,
      'Build toward 80% accuracy'::text,
      'Use focused practice and review mistakes to improve answer accuracy.'::text,
      80::numeric,
      null::text,
      ('Current overall accuracy is ' || round(oa.accuracy)::text || '%. A consistent accuracy target can build stronger foundations.')::text,
      1::integer
    from overall_accuracy oa
    where oa.accuracy > 0
      and oa.accuracy < 80
      and not exists (
        select 1 from public.parent_learning_goals g
        where g.student_id = p_student_id
          and g.status = 'active'
          and g.goal_type = 'accuracy'
      )
  ),
  practice_days as (
    select count(distinct qa.created_at::date)::integer as days
    from public.question_attempts qa
    where qa.user_id = p_student_id
      and qa.created_at >= current_date - interval '6 days'
      and qa.created_at < current_date + interval '1 day'
  ),
  practice_recommendation as (
    select
      'practice-days-week'::text,
      'practice_days'::text,
      'Practice on 3 days this week'::text,
      'Short, consistent sessions can build a reliable learning habit.'::text,
      3::numeric,
      null::text,
      ('The learner has practiced on ' || pd.days::text || ' of the last 7 days.')::text,
      2::integer
    from practice_days pd
    where pd.days < 3
      and not exists (
        select 1 from public.parent_learning_goals g
        where g.student_id = p_student_id
          and g.status = 'active'
          and g.goal_type = 'practice_days'
      )
  )
  select * from topic_recommendations
  union all
  select * from accuracy_recommendation
  union all
  select * from practice_recommendation
  order by priority asc, recommendation_id asc
  limit 3;
end;
$$;

revoke all
on function public.get_parent_goal_recommendations(uuid)
from public, anon;

grant execute
on function public.get_parent_goal_recommendations(uuid)
to authenticated;
