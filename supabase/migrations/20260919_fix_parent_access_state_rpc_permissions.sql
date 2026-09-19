-- Fix parent subscription status RPC access.
-- The function performs its own parent/learner authorization check, then reads
-- the protected user_subscriptions table with controlled SECURITY DEFINER access.

create or replace function public.get_learner_access_state(p_learner_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  s public.user_subscriptions%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.parent_learner_accounts
    where parent_id=(select auth.uid())
      and learner_id=p_learner_id
  ) and p_learner_id <> (select auth.uid()) then
    raise exception 'Not authorized';
  end if;

  select * into s
  from public.user_subscriptions
  where user_id=p_learner_id
  order by created_at desc
  limit 1;

  if s.id is null then
    return jsonb_build_object(
      'access','enabled',
      'status','grandfathered',
      'reason','grandfathered',
      'payment_required',false
    );
  end if;

  if s.status='trialing' and coalesce(s.trial_ends_at,now()) <= now() then
    update public.user_subscriptions
      set status='expired',updated_at=now()
      where id=s.id;
    s.status := 'expired';
  end if;

  if s.status='active' and coalesce(s.current_period_end,now()) <= now() then
    update public.user_subscriptions
      set status='expired',updated_at=now()
      where id=s.id;
    s.status := 'expired';
  end if;

  return jsonb_build_object(
    'access', case when s.status in ('trialing','active') then 'enabled' else 'disabled' end,
    'status',s.status,
    'trial_ends_at',s.trial_ends_at,
    'period_end',s.current_period_end,
    'days_left', greatest(
      0,
      ceil(extract(epoch from (coalesce(s.trial_ends_at,s.current_period_end)-now()))/86400.0)
    )::int,
    'payment_required', s.status='expired'
  );
end;
$function$;

revoke execute on function public.get_learner_access_state(uuid) from public;
grant execute on function public.get_learner_access_state(uuid) to authenticated;
