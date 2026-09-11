-- Parent Dashboard 2.1: secure weekly learning analytics.
-- Returns only calendar-day aggregates for an explicitly linked parent/guardian.

create or replace function public.get_parent_weekly_activity(p_student_id uuid)
returns table(
  activity_date date,
  questions_answered bigint,
  correct_answers bigint,
  xp_earned bigint,
  practice_minutes integer
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
  with days as (
    select generate_series(current_date - 6, current_date, interval '1 day')::date as day
  ),
  daily as (
    select
      qa.created_at::date as day,
      count(*)::bigint as answered,
      count(*) filter (where qa.is_correct)::bigint as correct,
      coalesce(sum(qa.xp_awarded),0)::bigint as xp
    from public.question_attempts qa
    where qa.user_id = p_student_id
      and qa.created_at >= current_date - interval '6 days'
      and qa.created_at < current_date + interval '1 day'
    group by qa.created_at::date
  )
  select
    d.day,
    coalesce(x.answered,0),
    coalesce(x.correct,0),
    coalesce(x.xp,0),
    0::integer
  from days d
  left join daily x on x.day = d.day
  order by d.day;
end;
$$;

revoke all on function public.get_parent_weekly_activity(uuid) from public, anon;
grant execute on function public.get_parent_weekly_activity(uuid) to authenticated;
