-- ============================================================
-- 0033_parent_learning_intelligence.sql
-- Parent Dashboard — Smart Learning Intelligence 3.0
-- ============================================================

-- Weekly parent-safe summary. All calculations are derived from
-- question_attempts and the active parent/guardian relationship.
create or replace function public.get_parent_learning_summary(
  p_student_id uuid
)
returns table(
  week_start date,
  week_end date,
  questions_answered bigint,
  correct_answers bigint,
  accuracy numeric,
  practice_days integer,
  xp_earned bigint,
  previous_questions bigint,
  previous_accuracy numeric,
  previous_practice_days integer,
  previous_xp bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date := current_date - 6;
  v_previous_start date := current_date - 13;
  v_previous_end date := current_date - 7;
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

  return query
  with current_period as (
    select
      count(*)::bigint as questions,
      count(*) filter (where qa.is_correct)::bigint as correct,
      count(distinct qa.created_at::date)::integer as practice_days,
      coalesce(sum(qa.xp_awarded),0)::bigint as xp
    from public.question_attempts qa
    where qa.user_id = p_student_id
      and qa.created_at::date between v_week_start and current_date
  ),
  previous_period as (
    select
      count(*)::bigint as questions,
      count(*) filter (where qa.is_correct)::bigint as correct,
      count(distinct qa.created_at::date)::integer as practice_days,
      coalesce(sum(qa.xp_awarded),0)::bigint as xp
    from public.question_attempts qa
    where qa.user_id = p_student_id
      and qa.created_at::date between v_previous_start and v_previous_end
  )
  select
    v_week_start,
    current_date,
    c.questions,
    c.correct,
    coalesce(round(c.correct::numeric / nullif(c.questions::numeric,0) * 100, 1),0),
    c.practice_days,
    c.xp,
    p.questions,
    coalesce(round(p.correct::numeric / nullif(p.questions::numeric,0) * 100, 1),0),
    p.practice_days,
    p.xp
  from current_period c cross join previous_period p;
end;
$$;

revoke all on function public.get_parent_learning_summary(uuid) from public, anon;
grant execute on function public.get_parent_learning_summary(uuid) to authenticated;

-- Parent-safe insights. These deliberately expose learning signals rather
-- than teacher interventions, private notes, or staff-only recommendations.
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

-- Generates only parent-safe smart alerts. Existing alerts remain intact;
-- unique alert titles prevent repeated inserts on every dashboard visit.
create or replace function public.generate_parent_smart_alerts(
  p_student_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created integer := 0;
  v_insight record;
  v_goal record;
  v_progress integer;
  v_days_total integer;
  v_days_elapsed integer;
  v_expected integer;
  v_summary record;
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

  -- Weekly summary milestones.
  select * into v_summary
  from public.get_parent_learning_summary(p_student_id);

  if v_summary.questions_answered > 0 then
    insert into public.parent_learning_alerts(
      student_id, alert_type, title, message, priority
    ) values (
      p_student_id,
      'weekly_summary',
      'Weekly learning summary',
      'This week: ' || v_summary.questions_answered::text || ' questions, ' ||
      round(v_summary.accuracy)::text || '% accuracy, ' ||
      v_summary.practice_days::text || ' practice days, and ' ||
      v_summary.xp_earned::text || ' XP earned.',
      3
    ) on conflict (student_id, alert_type, title) do nothing;
    if found then v_created := v_created + 1; end if;
  end if;

  -- Convert the highest-value current insights into alerts.
  for v_insight in
    select * from public.get_parent_learning_insights(p_student_id)
    order by priority asc
    limit 3
  loop
    insert into public.parent_learning_alerts(
      student_id, alert_type, title, message, priority
    ) values (
      p_student_id,
      'smart_' || v_insight.insight_type,
      v_insight.title,
      v_insight.message,
      v_insight.priority
    ) on conflict (student_id, alert_type, title) do nothing;
    if found then v_created := v_created + 1; end if;
  end loop;

  -- Goal pacing: compare actual progress with the percentage of the goal
  -- period that has elapsed. This is intentionally independent of a physical
  -- progress_percent column because progress is calculated by get_parent_learning_goals.
  for v_goal in
    select g.id, g.title, g.start_date, g.due_date, g.status,
           coalesce(x.current_value,0) as current_value,
           least(100, greatest(0, round(coalesce(x.current_value,0) / nullif(g.target_value,0) * 100)))::integer as progress_percent,
           g.target_value
    from public.parent_learning_goals g
    left join lateral (
      select case g.goal_type
        when 'questions' then count(*)::numeric
        when 'accuracy' then coalesce(round(count(*) filter (where qa.is_correct)::numeric / nullif(count(*)::numeric,0) * 100,0),0)
        when 'xp' then coalesce(sum(qa.xp_awarded),0)::numeric
        when 'practice_days' then count(distinct qa.created_at::date)::numeric
      end as current_value
      from public.question_attempts qa
      where qa.user_id = g.student_id
        and qa.created_at::date between g.start_date and least(g.due_date,current_date)
    ) x on true
    where g.student_id = p_student_id
      and g.status = 'active'
      and g.due_date >= current_date
  loop
    v_days_total := greatest(1, v_goal.due_date - v_goal.start_date);
    v_days_elapsed := greatest(0, least(v_days_total, current_date - v_goal.start_date));
    v_expected := greatest(0, least(100, round(v_days_elapsed::numeric / v_days_total::numeric * 100)));
    v_progress := coalesce(v_goal.progress_percent,0);

    if v_progress >= 100 then
      insert into public.parent_learning_alerts(
        student_id, alert_type, title, message, priority, related_goal_id
      ) values (
        p_student_id,
        'goal_achieved',
        'Goal achieved: ' || v_goal.title,
        'The learner has reached 100% of the goal target. Great work!',
        3,
        v_goal.id
      ) on conflict (student_id, alert_type, title) do nothing;
      if found then v_created := v_created + 1; end if;
    elsif current_date >= v_goal.due_date - 2 then
      insert into public.parent_learning_alerts(
        student_id, alert_type, title, message, priority, related_goal_id
      ) values (
        p_student_id,
        'goal_deadline',
        'Goal deadline approaching: ' || v_goal.title,
        'The goal is due soon and is currently ' || v_progress::text || '% complete.',
        1,
        v_goal.id
      ) on conflict (student_id, alert_type, title) do nothing;
      if found then v_created := v_created + 1; end if;
    elsif v_progress + 15 < v_expected and v_expected >= 35 then
      insert into public.parent_learning_alerts(
        student_id, alert_type, title, message, priority, related_goal_id
      ) values (
        p_student_id,
        'goal_behind',
        'Goal may be falling behind: ' || v_goal.title,
        'The goal is ' || v_progress::text || '% complete, while roughly ' || v_expected::text || '% of its time has elapsed. A short focused session may help.',
        1,
        v_goal.id
      ) on conflict (student_id, alert_type, title) do nothing;
      if found then v_created := v_created + 1; end if;
    end if;
  end loop;

  return v_created;
end;
$$;

revoke all on function public.generate_parent_smart_alerts(uuid)
from public, anon;

grant execute on function public.generate_parent_smart_alerts(uuid)
to authenticated;
