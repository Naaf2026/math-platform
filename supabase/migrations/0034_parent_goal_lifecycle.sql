-- Parent Goal Lifecycle
-- Adds safe parent/guardian lifecycle operations for learning goals.
-- No schema changes are required because parent_learning_goals already has
-- title, description, target, topic, dates and status fields.

create or replace function public.update_parent_learning_goal(
  p_goal_id uuid,
  p_title text default null,
  p_description text default null,
  p_target_value numeric default null,
  p_topic_title text default null,
  p_due_date date default null
)
returns public.parent_learning_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal public.parent_learning_goals;
begin
  if not exists (
    select 1
    from public.parent_learning_goals g
    join public.student_relationships sr
      on sr.student_id = g.student_id
    where g.id = p_goal_id
      and sr.related_user_id = auth.uid()
      and sr.relationship in ('parent', 'guardian')
      and sr.status = 'active'
  ) then
    raise exception 'Not authorized to update this goal';
  end if;

  if p_title is not null and length(trim(p_title)) < 3 then
    raise exception 'Goal title must be at least 3 characters';
  end if;

  if p_target_value is not null and p_target_value <= 0 then
    raise exception 'Target value must be greater than zero';
  end if;

  update public.parent_learning_goals
  set
    title = coalesce(nullif(trim(p_title), ''), title),
    description = case when p_description is null then description else p_description end,
    target_value = coalesce(p_target_value, target_value),
    topic_title = case when p_topic_title is null then topic_title else nullif(trim(p_topic_title), '') end,
    due_date = coalesce(p_due_date, due_date),
    updated_at = now()
  where id = p_goal_id
  returning * into v_goal;

  if v_goal.due_date < v_goal.start_date then
    raise exception 'Due date cannot be before the start date';
  end if;

  return v_goal;
end;
$$;

create or replace function public.set_parent_learning_goal_status(
  p_goal_id uuid,
  p_status text
)
returns public.parent_learning_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal public.parent_learning_goals;
begin
  if p_status not in ('active', 'completed', 'paused', 'cancelled') then
    raise exception 'Invalid goal status';
  end if;

  if not exists (
    select 1
    from public.parent_learning_goals g
    join public.student_relationships sr
      on sr.student_id = g.student_id
    where g.id = p_goal_id
      and sr.related_user_id = auth.uid()
      and sr.relationship in ('parent', 'guardian')
      and sr.status = 'active'
  ) then
    raise exception 'Not authorized to change this goal';
  end if;

  update public.parent_learning_goals
  set
    status = p_status,
    updated_at = now()
  where id = p_goal_id
  returning * into v_goal;

  return v_goal;
end;
$$;

revoke all on function public.update_parent_learning_goal(uuid, text, text, numeric, text, date) from public;
grant execute on function public.update_parent_learning_goal(uuid, text, text, numeric, text, date) to authenticated;

revoke all on function public.set_parent_learning_goal_status(uuid, text) from public;
grant execute on function public.set_parent_learning_goal_status(uuid, text) to authenticated;
