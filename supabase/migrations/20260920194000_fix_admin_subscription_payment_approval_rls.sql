-- Run subscription payment approval with controlled definer privileges.
-- The function still verifies the caller is an admin before changing any data.
create or replace function public.approve_subscription_payment(p_payment_id uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  p public.subscription_payments%rowtype;
  premium_plan uuid;
  now_ts timestamptz := now();
  period_start timestamptz;
  period_end timestamptz;
begin
  if not exists (select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role in ('admin','super_admin')) then
    raise exception 'Admin access required';
  end if;
  select * into p from public.subscription_payments where id=p_payment_id for update;
  if p.id is null then raise exception 'Payment not found'; end if;
  if p.status='approved' then return jsonb_build_object('status','approved','payment_id',p.id); end if;
  select id into premium_plan from public.subscription_plans where slug='premium' and active limit 1;
  if premium_plan is null then raise exception 'Premium subscription plan is not configured'; end if;
  select current_period_start,current_period_end into period_start,period_end
    from public.user_subscriptions where user_id=p.learner_id and status in ('active','trialing') order by created_at desc limit 1;
  if period_end is not null and period_end > now_ts then period_start := period_end; else period_start := now_ts; end if;
  period_end := period_start + interval '1 month';
  update public.subscription_payments set status='approved',reviewed_at=now_ts,reviewed_by=(select auth.uid()),review_note=p_note where id=p.id;
  update public.user_subscriptions set plan_id=premium_plan,status='active',current_period_start=period_start,current_period_end=period_end,trial_ends_at=null,updated_at=now_ts where user_id=p.learner_id;
  if not found then insert into public.user_subscriptions(user_id,plan_id,status,current_period_start,current_period_end) values(p.learner_id,premium_plan,'active',period_start,period_end); end if;
  return jsonb_build_object('status','approved','payment_id',p.id,'learner_id',p.learner_id,'period_end',period_end);
end;
$function$;

revoke all on function public.approve_subscription_payment(uuid,text) from public;
grant execute on function public.approve_subscription_payment(uuid,text) to authenticated;
