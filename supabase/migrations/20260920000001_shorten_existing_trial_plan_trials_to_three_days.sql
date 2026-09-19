-- Existing learner trials that were started as 7-day trials are shortened to 3 days.
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
  and sp.slug = 'trial'
  and us.status = 'trialing'
  and us.trial_started_at is not null;
