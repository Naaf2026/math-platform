-- ============================================================
-- 0035_parent_goal_lifecycle_intelligence.sql
-- Parent Goal Lifecycle Intelligence
-- ============================================================
-- Keeps parent intelligence aligned with goal lifecycle state.
-- No schema changes are required.

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
    select 1
    from public.student_relationships sr
    where sr.student_id = p_student_id
      and sr.related_user_id = auth.uid()
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  ) then
    raise exception 'Student is not linked to this parent account';
  end if;

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

  -- Lifecycle-aware goal intelligence.
  -- Only active goals participate in pacing/deadline alerts. Paused and
  -- cancelled goals are intentionally silent so parents are not warned about
  -- goals that are not currently expected to progress.
  for v_goal in
    select
      g.id,
      g.title,
      g.start_date,
      g.due_date,
      g.status,
      coalesce(x.current_value,0) as current_value,
      least(
        100,
        greatest(
          0,
          round(coalesce(x.current_value,0) / nullif(g.target_value,0) * 100)
        )
      )::integer as progress_percent,
      g.target_value
    from public.parent_learning_goals g
    left join lateral (
      select case g.goal_type
        when 'questions' then count(*)::numeric
        when 'accuracy' then coalesce(
          round(
            count(*) filter (where qa.is_correct)::numeric /
            nullif(count(*)::numeric,0) * 100,
            0
          ),0
        )
        when 'xp' then coalesce(sum(qa.xp_awarded),0)::numeric
        when 'practice_days' then count(distinct qa.created_at::date)::numeric
      end as current_value
      from public.question_attempts qa
      where qa.user_id = g.student_id
        and qa.created_at::date between g.start_date and least(g.due_date,current_date)
    ) x on true
    where g.student_id = p_student_id
      and g.status = 'active'
  loop
    v_progress := coalesce(v_goal.progress_percent,0);

    -- Completed targets are surfaced even when the goal has not yet reached
    -- its due date. The alert is idempotent because of the unique constraint.
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

    elsif current_date > v_goal.due_date then
      insert into public.parent_learning_alerts(
        student_id, alert_type, title, message, priority, related_goal_id
      ) values (
        p_student_id,
        'goal_overdue',
        'Goal overdue: ' || v_goal.title,
        'The goal passed its due date at ' || v_progress::text || '% complete. You can review the goal and decide whether to resume, adjust, or cancel it.',
        1,
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

    else
      v_days_total := greatest(1, v_goal.due_date - v_goal.start_date);
      v_days_elapsed := greatest(
        0,
        least(v_days_total, current_date - v_goal.start_date)
      );
      v_expected := greatest(
        0,
        least(
          100,
          round(v_days_elapsed::numeric / v_days_total::numeric * 100)
        )
      );

      if v_progress + 15 < v_expected and v_expected >= 35 then
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
    end if;
  end loop;

  return v_created;
end;
$$;

revoke all on function public.generate_parent_smart_alerts(uuid)
from public, anon;

grant execute on function public.generate_parent_smart_alerts(uuid)
to authenticated;
