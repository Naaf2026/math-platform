-- ============================================================
-- 0032_parent_learning_alerts.sql
-- Parent Dashboard — Learning Alerts & Notifications
-- ============================================================

create table if not exists public.parent_learning_alerts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  alert_type text not null,
  title text not null,
  message text not null,
  priority integer not null default 2,
  related_goal_id uuid null references public.parent_learning_goals(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz null,
  unique (student_id, alert_type, title)
);

create index if not exists parent_learning_alerts_student_created_idx
  on public.parent_learning_alerts(student_id, created_at desc);

create index if not exists parent_learning_alerts_student_unread_idx
  on public.parent_learning_alerts(student_id, read_at)
  where read_at is null;

alter table public.parent_learning_alerts enable row level security;

revoke all on table public.parent_learning_alerts from public, anon;
grant select on table public.parent_learning_alerts to authenticated;

drop policy if exists parent_learning_alerts_parent_select on public.parent_learning_alerts;

create policy parent_learning_alerts_parent_select
on public.parent_learning_alerts
for select
to authenticated
using (
  exists (
    select 1
    from public.student_relationships sr
    where sr.student_id = parent_learning_alerts.student_id
      and sr.related_user_id = auth.uid()
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  )
);

create or replace function public.get_parent_learning_alerts(
  p_student_id uuid,
  p_limit integer default 20
)
returns table(
  alert_id uuid,
  alert_type text,
  title text,
  message text,
  priority integer,
  related_goal_id uuid,
  created_at timestamptz,
  read_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  if not exists (
    select 1 from public.student_relationships sr
    where sr.student_id = p_student_id
      and sr.related_user_id = auth.uid()
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  ) then raise exception 'Student is not linked to this parent account'; end if;

  return query
  select a.id, a.alert_type, a.title, a.message, a.priority,
         a.related_goal_id, a.created_at, a.read_at
  from public.parent_learning_alerts a
  where a.student_id = p_student_id
  order by a.read_at is null desc, a.priority asc, a.created_at desc
  limit greatest(1, least(coalesce(p_limit,20),50));
end;
$$;

revoke all on function public.get_parent_learning_alerts(uuid, integer) from public, anon;
grant execute on function public.get_parent_learning_alerts(uuid, integer) to authenticated;

create or replace function public.mark_parent_learning_alert_read(p_alert_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  update public.parent_learning_alerts a
  set read_at = coalesce(a.read_at, now())
  where a.id = p_alert_id
    and exists (
      select 1 from public.student_relationships sr
      where sr.student_id = a.student_id
        and sr.related_user_id = auth.uid()
        and sr.relationship in ('parent','guardian')
        and sr.status = 'active'
    );

  return found;
end;
$$;

revoke all on function public.mark_parent_learning_alert_read(uuid) from public, anon;
grant execute on function public.mark_parent_learning_alert_read(uuid) to authenticated;

-- Legacy generator retained for compatibility with older clients.
-- It uses only the current physical schema; smart notifications use
-- generate_parent_smart_alerts from migration 0033.
create or replace function public.generate_parent_learning_alerts(p_student_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created integer := 0;
  v_accuracy numeric := 0;
  v_recent_days integer := 0;
  v_recent_questions integer := 0;
  v_streak integer := 0;
  v_goal record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  if not exists (
    select 1 from public.student_relationships sr
    where sr.student_id = p_student_id
      and sr.related_user_id = auth.uid()
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  ) then raise exception 'Student is not linked to this parent account'; end if;

  select coalesce(round(count(*) filter (where qa.is_correct)::numeric / nullif(count(*)::numeric,0) * 100,0),0)
  into v_accuracy
  from public.question_attempts qa where qa.user_id = p_student_id;

  select count(distinct qa.created_at::date)::integer, count(*)::integer
  into v_recent_days, v_recent_questions
  from public.question_attempts qa
  where qa.user_id = p_student_id
    and qa.created_at >= current_date - interval '6 days'
    and qa.created_at < current_date + interval '1 day';

  -- Keep the legacy milestone check independent of profiles columns.
  -- A 7-day streak is represented when there is recorded practice on
  -- each of the last seven calendar days.
  if v_recent_days = 7 then
    v_streak := 7;
  end if;

  if v_recent_questions = 0 then
    insert into public.parent_learning_alerts(student_id,alert_type,title,message,priority)
    values (p_student_id,'no_recent_practice','Time for a learning session','There has been no recorded practice in the last 7 days. A short session can help keep learning momentum going.',1)
    on conflict (student_id,alert_type,title) do nothing;
    if found then v_created := v_created + 1; end if;
  elsif v_recent_days < 3 then
    insert into public.parent_learning_alerts(student_id,alert_type,title,message,priority)
    values (p_student_id,'practice_consistency','Build a steadier learning habit','The learner has practiced on '||v_recent_days||' of the last 7 days. A few short, consistent sessions could strengthen progress.',2)
    on conflict (student_id,alert_type,title) do nothing;
    if found then v_created := v_created + 1; end if;
  end if;

  if v_accuracy > 0 and v_accuracy < 60 then
    insert into public.parent_learning_alerts(student_id,alert_type,title,message,priority)
    values (p_student_id,'accuracy_attention','Accuracy needs some extra support','Overall accuracy is currently '||round(v_accuracy)::text||'%. Focused review and practice may help strengthen understanding.',1)
    on conflict (student_id,alert_type,title) do nothing;
    if found then v_created := v_created + 1; end if;
  elsif v_accuracy >= 80 then
    insert into public.parent_learning_alerts(student_id,alert_type,title,message,priority)
    values (p_student_id,'accuracy_positive','Strong learning progress','Overall accuracy is currently '||round(v_accuracy)::text||'%. Keep encouraging consistent practice.',3)
    on conflict (student_id,alert_type,title) do nothing;
    if found then v_created := v_created + 1; end if;
  end if;

  if v_streak >= 7 then
    insert into public.parent_learning_alerts(student_id,alert_type,title,message,priority)
    values (p_student_id,'streak_milestone','Learning streak milestone','The learner has reached a 7-day learning streak. Celebrate the consistency!',3)
    on conflict (student_id,alert_type,title) do nothing;
    if found then v_created := v_created + 1; end if;
  end if;

  for v_goal in
    select g.id, g.title, g.due_date
    from public.parent_learning_goals g
    where g.student_id = p_student_id
      and g.status = 'active'
      and g.due_date >= current_date
      and g.due_date <= current_date + 3
  loop
    insert into public.parent_learning_alerts(student_id,alert_type,title,message,priority,related_goal_id)
    values (
      p_student_id,'goal_deadline','Goal deadline approaching',
      'The goal "'||v_goal.title||'" is due on '||to_char(v_goal.due_date,'Mon DD')||'.',1,v_goal.id
    ) on conflict (student_id,alert_type,title) do nothing;
    if found then v_created := v_created + 1; end if;
  end loop;

  return v_created;
end;
$$;

revoke all on function public.generate_parent_learning_alerts(uuid) from public, anon;
grant execute on function public.generate_parent_learning_alerts(uuid) to authenticated;
