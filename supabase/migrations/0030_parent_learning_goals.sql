-- ============================================================
-- 0030_parent_learning_goals.sql
-- Parent Dashboard — Learning Goals & Progress
-- ============================================================

create table if not exists public.parent_learning_goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 3 and 120),
  description text,
  goal_type text not null check (goal_type in ('questions','accuracy','xp','practice_days')),
  target_value numeric not null check (target_value > 0),
  topic_title text,
  start_date date not null default current_date,
  due_date date not null,
  status text not null default 'active' check (status in ('active','completed','paused','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date >= start_date)
);

create index if not exists parent_learning_goals_student_idx
  on public.parent_learning_goals(student_id, status, due_date);

create index if not exists parent_learning_goals_creator_idx
  on public.parent_learning_goals(created_by, created_at desc);

alter table public.parent_learning_goals enable row level security;

-- Keep direct table access restricted. Parent-facing operations go through
-- security-definer functions that validate the active relationship.
revoke all on table public.parent_learning_goals from public, anon, authenticated;

create or replace function public.create_parent_learning_goal(
  p_student_id uuid,
  p_title text,
  p_description text default null,
  p_goal_type text default 'questions',
  p_target_value numeric default 20,
  p_topic_title text default null,
  p_start_date date default current_date,
  p_due_date date default current_date + 6
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
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

  insert into public.parent_learning_goals (
    student_id,
    created_by,
    title,
    description,
    goal_type,
    target_value,
    topic_title,
    start_date,
    due_date
  )
  values (
    p_student_id,
    auth.uid(),
    trim(p_title),
    nullif(trim(coalesce(p_description,'')), ''),
    p_goal_type,
    p_target_value,
    nullif(trim(coalesce(p_topic_title,'')), ''),
    p_start_date,
    p_due_date
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.get_parent_learning_goals(
  p_student_id uuid
)
returns table(
  goal_id uuid,
  title text,
  description text,
  goal_type text,
  target_value numeric,
  current_value numeric,
  progress_percent integer,
  topic_title text,
  start_date date,
  due_date date,
  status text,
  days_remaining integer
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
  with goal_values as (
    select
      g.*,
      case g.goal_type
        when 'questions' then (
          select count(*)::numeric
            from public.question_attempts qa
           where qa.user_id = g.student_id
             and qa.created_at::date between g.start_date and least(g.due_date, current_date)
        )
        when 'accuracy' then (
          select coalesce(
            round(
              count(*) filter (where qa.is_correct)::numeric
              / nullif(count(*)::numeric, 0) * 100
            , 0),
            0
          )
            from public.question_attempts qa
           where qa.user_id = g.student_id
             and qa.created_at::date between g.start_date and least(g.due_date, current_date)
        )
        when 'xp' then (
          select coalesce(sum(qa.xp_awarded), 0)::numeric
            from public.question_attempts qa
           where qa.user_id = g.student_id
             and qa.created_at::date between g.start_date and least(g.due_date, current_date)
        )
        when 'practice_days' then (
          select count(distinct qa.created_at::date)::numeric
            from public.question_attempts qa
           where qa.user_id = g.student_id
             and qa.created_at::date between g.start_date and least(g.due_date, current_date)
        )
      end as current_value
    from public.parent_learning_goals g
    where g.student_id = p_student_id
      and g.status in ('active','completed','paused')
    order by g.due_date asc, g.created_at desc
  )
  select
    gv.id,
    gv.title,
    gv.description,
    gv.goal_type,
    gv.target_value,
    gv.current_value,
    least(100, greatest(0, round(gv.current_value / nullif(gv.target_value,0) * 100)))::integer,
    gv.topic_title,
    gv.start_date,
    gv.due_date,
    case
      when gv.status = 'active' and gv.current_value >= gv.target_value then 'completed'
      else gv.status
    end,
    greatest(0, gv.due_date - current_date)::integer
  from goal_values gv;
end;
$$;

revoke all on function public.create_parent_learning_goal(uuid,text,text,text,numeric,text,date,date)
  from public, anon;
grant execute on function public.create_parent_learning_goal(uuid,text,text,text,numeric,text,date,date)
  to authenticated;

revoke all on function public.get_parent_learning_goals(uuid)
  from public, anon;
grant execute on function public.get_parent_learning_goals(uuid)
  to authenticated;
