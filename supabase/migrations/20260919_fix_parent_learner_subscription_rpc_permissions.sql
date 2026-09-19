create or replace function public.get_my_learners()
returns table(
  learner_id uuid,
  username text,
  display_name text,
  grade text,
  avatar_emoji text,
  account_status text,
  xp integer,
  current_streak integer,
  best_streak integer,
  created_at timestamptz,
  subscription_status text,
  trial_ends_at timestamptz,
  period_ends_at timestamptz,
  subscription_days_left integer
)
language sql
security definer
set search_path to public, pg_temp
as $function$
  select
    pla.learner_id,
    pla.username,
    coalesce(p.display_name,p.full_name,pla.username),
    p.grade,
    p.avatar_emoji,
    p.account_status,
    coalesce(p.xp,0),
    coalesce(p.current_streak,0),
    coalesce(p.best_streak,0),
    pla.created_at,
    coalesce(us.status, 'demo'),
    us.trial_ends_at,
    us.current_period_end,
    case
      when us.status = 'trialing'
        then greatest(0, ceil(extract(epoch from (coalesce(us.trial_ends_at, now()) - now())) / 86400.0))::int
      when us.status = 'active'
        then greatest(0, ceil(extract(epoch from (coalesce(us.current_period_end, now()) - now())) / 86400.0))::int
      else 0
    end
  from public.parent_learner_accounts pla
  join public.profiles p on p.id=pla.learner_id
  left join lateral (
    select status, trial_ends_at, current_period_end, created_at
    from public.user_subscriptions
    where user_id=pla.learner_id
    order by created_at desc
    limit 1
  ) us on true
  where pla.parent_id=(select auth.uid())
  order by pla.created_at desc;
$function$;

grant execute on function public.get_my_learners() to authenticated;
