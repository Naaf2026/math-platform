-- Repair the live parent history insights function: topic names belong to learning_topics.
create or replace function public.get_parent_learning_insights(
  p_student_id uuid
)
returns table(
  insight_type text,
  title text,
  message text,
  priority integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_questions bigint := 0;
  v_correct bigint := 0;
  v_accuracy numeric := 0;
  v_days integer := 0;
  v_xp bigint := 0;
  v_prev_questions bigint := 0;
  v_prev_accuracy numeric := 0;
  v_prev_days integer := 0;
  v_topic record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.student_relationships sr
    where sr.student_id = p_student_id
      and sr.related_user_id = auth.uid()
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  ) then
    raise exception 'Student is not linked to this parent account';
  end if;

  select
    s.questions_answered, s.correct_answers, s.accuracy,
    s.practice_days, s.xp_earned, s.previous_questions,
    s.previous_accuracy, s.previous_practice_days
  into
    v_questions, v_correct, v_accuracy, v_days, v_xp,
    v_prev_questions, v_prev_accuracy, v_prev_days
  from public.get_parent_learning_summary(p_student_id) s;

  if v_questions = 0 and v_prev_questions = 0 then
    return query select
      'starting_point'::text,
      'Ready for a fresh start'::text,
      'No recent practice has been recorded yet. A short session is a good way to build momentum.',
      2;
    return;
  end if;

  if v_questions > 0 and v_prev_questions > 0 and v_accuracy >= v_prev_accuracy + 5 then
    return query select
      'improvement'::text,
      'Accuracy is improving'::text,
      'Accuracy increased from ' || round(v_prev_accuracy)::text || '% to ' || round(v_accuracy)::text || '% this week.',
      3;
  elsif v_questions > 0 and v_prev_questions > 0 and v_accuracy <= v_prev_accuracy - 10 then
    return query select
      'accuracy_decline'::text,
      'Accuracy has dipped'::text,
      'Accuracy moved from ' || round(v_prev_accuracy)::text || '% to ' || round(v_accuracy)::text || '%. A little focused review may help.',
      1;
  end if;

  if v_days >= 5 then
    return query select
      'consistency'::text,
      'Strong learning consistency'::text,
      'The learner practiced on ' || v_days::text || ' of the last 7 days. That regular routine is a strong habit.',
      3;
  elsif v_questions > 0 and v_days <= 2 then
    return query select
      'consistency_attention'::text,
      'Consistency could improve'::text,
      'Practice was recorded on only ' || v_days::text || ' of the last 7 days. Short, regular sessions may be more effective than occasional long sessions.',
      2;
  end if;

  if v_questions > v_prev_questions and v_prev_questions > 0 then
    return query select
      'engagement'::text,
      'More practice this week'::text,
      'The learner completed ' || v_questions::text || ' questions this week, up from ' || v_prev_questions::text || ' last week.',
      3;
  end if;

  -- Weak-topic signal. question_attempts stores the question id; topic names
  -- are resolved through learning_questions -> learning_topics.
  select
    lt.title as topic_title,
    count(*)::integer as attempts,
    round(
      count(*) filter (where qa.is_correct)::numeric
      / nullif(count(*)::numeric,0) * 100,
      0
    ) as topic_accuracy
  into v_topic
  from public.question_attempts qa
  join public.learning_questions lq on lq.id = qa.question_id
  join public.learning_topics lt on lt.id = lq.topic_id
  where qa.user_id = p_student_id
    and qa.created_at >= current_date - interval '13 days'
  group by lt.id, lt.title
  having count(*) >= 5
  order by
    (
      count(*) filter (where qa.is_correct)::numeric
      / nullif(count(*)::numeric,0)
    ) asc,
    count(*) desc
  limit 1;

  if v_topic.topic_title is not null and v_topic.topic_accuracy < 65 then
    return query select
      'topic_support'::text,
      'A topic may need extra practice'::text,
      'Recent accuracy in ' || v_topic.topic_title || ' is around ' || round(v_topic.topic_accuracy)::text || '%. A few focused practice questions could help.',
      1;
  end if;

  if v_xp > 0 then
    return query select
      'positive_momentum'::text,
      'Keep the momentum going'::text,
      'The learner earned ' || v_xp::text || ' XP this week. Consistent practice can keep this progress moving forward.',
      3;
  end if;
end;
$$;

revoke all on function public.get_parent_learning_insights(uuid)
from public, anon;

grant execute on function public.get_parent_learning_insights(uuid)
to authenticated;

