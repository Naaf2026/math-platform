drop function if exists public.get_admin_user_directory(text);

create function public.get_admin_user_directory(p_role text default null)
returns table(
  id uuid,
  full_name text,
  display_name text,
  grade text,
  learning_level text,
  role text,
  account_status text,
  subscription_status text,
  subscription_plan text,
  subscription_ends_at timestamptz
)
language sql
security definer
set search_path to 'public'
as $function$
  with directory as (
    select p.id, p.full_name, p.display_name, p.grade, p.learning_level,
      coalesce(ur.role, 'unassigned') as role,
      coalesce(p.account_status, 'active') as account_status
    from public.profiles p
    left join public.user_roles ur on ur.user_id = p.id
    where public.has_role('admin')
      and (p_role is null or (p_role = 'unassigned' and ur.user_id is null) or ur.role = p_role)
  ),
  latest_sub as (
    select distinct on (us.user_id)
      us.user_id, sp.slug, sp.name as plan_name, us.status,
      coalesce(us.current_period_end, us.trial_ends_at) as ends_at
    from public.user_subscriptions us
    join public.subscription_plans sp on sp.id = us.plan_id
    order by us.user_id, us.created_at desc
  )
  select d.id, d.full_name, d.display_name, d.grade, d.learning_level, d.role, d.account_status,
    case
      when d.role <> 'student' then 'not_applicable'
      when s.user_id is null then 'free'
      when s.ends_at is not null and s.ends_at <= now() then 'expired'
      when s.slug = 'premium' and s.status in ('active','trialing') then 'premium'
      when s.slug = 'trial' and s.status = 'trialing' and (s.ends_at is null or s.ends_at > now()) then 'trial'
      else 'free'
    end as subscription_status,
    case when d.role = 'student' then coalesce(s.plan_name, 'Free') else null end as subscription_plan,
    case when d.role = 'student' then s.ends_at else null end as subscription_ends_at
  from directory d
  left join latest_sub s on s.user_id = d.id
  order by
    case when d.role = 'student' then 0 else 1 end,
    case
      when d.role <> 'student' then 9
      when s.slug = 'premium' and s.status in ('active','trialing') and (s.ends_at is null or s.ends_at > now()) then 0
      when s.slug = 'trial' and s.status = 'trialing' and (s.ends_at is null or s.ends_at > now()) then 1
      when s.user_id is null then 2
      else 3
    end,
    case when d.account_status = 'inactive' then 1 else 0 end,
    coalesce(nullif(d.display_name, ''), nullif(d.full_name, ''), '');
$function$;