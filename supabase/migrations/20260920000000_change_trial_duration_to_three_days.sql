-- Change active Premium trials to 3 days and make every trial-start path use 3 days.
update public.user_subscriptions us
set
  trial_ends_at = us.trial_started_at + interval '3 days',
  current_period_end = case
    when us.current_period_end is null or us.current_period_end = us.trial_ends_at
      then us.trial_started_at + interval '3 days'
    else us.current_period_end
  end,
  updated_at = now()
from public.subscription_plans sp
where us.plan_id = sp.id
  and sp.slug = 'premium'
  and us.status = 'trialing'
  and us.trial_started_at is not null;

create or replace function public.auto_start_learner_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare premium_plan uuid;
begin
  select id into premium_plan from public.subscription_plans where slug='premium' and active limit 1;
  if premium_plan is null then return new; end if;
  if not exists (select 1 from public.user_subscriptions where user_id=new.learner_id) then
    insert into public.user_subscriptions(user_id,plan_id,status,trial_started_at,trial_ends_at,current_period_start,current_period_end)
    values(new.learner_id,premium_plan,'trialing',now(),now()+interval '3 days',now(),now()+interval '3 days');
  end if;
  return new;
end;
$function$;

create or replace function public.start_learner_trial(p_learner_id uuid)
returns jsonb
language plpgsql
set search_path = public
as $function$
declare trial_plan uuid; existing_sub public.user_subscriptions%rowtype;
begin
  if not exists (select 1 from public.parent_learner_accounts where parent_id=(select auth.uid()) and learner_id=p_learner_id) then
    raise exception 'You are not authorized to start a trial for this learner';
  end if;
  select id into trial_plan from public.subscription_plans where slug='trial' and active limit 1;
  if trial_plan is null then raise exception 'Trial plan is not configured'; end if;
  select * into existing_sub from public.user_subscriptions where user_id=p_learner_id order by created_at desc limit 1;
  if existing_sub.id is not null then
    return jsonb_build_object('status',existing_sub.status,'trial_ends_at',existing_sub.trial_ends_at,'subscription_id',existing_sub.id);
  end if;
  insert into public.user_subscriptions(user_id,plan_id,status,trial_started_at,trial_ends_at,current_period_start,current_period_end)
  values(p_learner_id,trial_plan,'trialing',now(),now()+interval '3 days',now(),now()+interval '3 days')
  returning * into existing_sub;
  return jsonb_build_object('status',existing_sub.status,'trial_ends_at',existing_sub.trial_ends_at,'subscription_id',existing_sub.id);
end;
$function$;

create or replace function public.start_premium_trial()
returns public.user_subscriptions
language plpgsql
set search_path = public
as $function$
declare uid uuid := (select auth.uid()); premium_id uuid; result public.user_subscriptions;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.user_subscriptions where user_id=uid and trial_started_at is not null) then
    raise exception 'Premium trial has already been used';
  end if;
  select id into premium_id from public.subscription_plans where slug='premium' and active=true;
  if premium_id is null then raise exception 'Premium plan is not configured'; end if;
  insert into public.user_subscriptions(user_id,plan_id,status,trial_started_at,trial_ends_at)
  values(uid,premium_id,'trialing',now(),now()+interval '3 days')
  returning * into result;
  return result;
exception
  when unique_violation then raise exception 'Premium trial has already been used or an active subscription exists';
end;
$function$;
