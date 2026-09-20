-- Subscription plan metadata is safe for authenticated learners to read.
-- The existing RLS policy "plans readable" still restricts rows to active plans.
grant select on table public.subscription_plans to authenticated;
