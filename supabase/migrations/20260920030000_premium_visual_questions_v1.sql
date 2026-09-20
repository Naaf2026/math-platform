-- Premium Visual Questions V1
-- Grade-aware visual question access, renderers, and secure answer handling.

alter table public.learning_questions
  drop constraint if exists learning_questions_question_type_check;

alter table public.learning_questions
  add constraint learning_questions_question_type_check
  check (question_type in ('multiple_choice','number_input','text_input','true_false','ordering','drag_drop','number_line','manipulatives','geometry','timed_challenge','visual_question','visual_table'));

-- The live project already contains the visual entitlement trigger.
-- This RPC exposes the current plan's visual quota to the learner UI.
create or replace function public.get_visual_question_access()
returns table(enabled boolean,daily_limit integer,used_today integer,plan_name text,subscription_status text,trial_ends_at timestamptz)
language sql stable security invoker set search_path=public
as $$
with current_sub as (
 select us.plan_id,us.status,us.trial_ends_at from public.user_subscriptions us
 where us.user_id=(select auth.uid()) and (us.status='active' or (us.status='trialing' and us.trial_ends_at>now()))
 order by us.created_at desc limit 1
), ent as (
 select pe.enabled,pe.daily_limit,p.name from public.plan_entitlements pe join public.subscription_plans p on p.id=pe.plan_id
 where pe.feature_key='visual_questions' and pe.plan_id=coalesce((select plan_id from current_sub),(select id from public.subscription_plans where slug='free')) limit 1
), u as (
 select coalesce((select su.usage_count from public.subscription_usage su where su.user_id=(select auth.uid()) and su.usage_date=current_date and su.feature_key='visual_questions'),0) used_today
)
select coalesce(ent.enabled,false),ent.daily_limit,u.used_today,coalesce(ent.name,'Free'),coalesce((select status from current_sub),'free'),(select trial_ends_at from current_sub)
from ent cross join u;
$$;

revoke all on function public.get_visual_question_access() from public,anon;
grant execute on function public.get_visual_question_access() to authenticated;

create or replace function public.get_visual_questions(p_limit integer default 20)
returns table(id text,prompt text,options jsonb,answer text,explanation text,difficulty text,skill text,question_type text,interaction_config jsonb,hint text,points integer,grade_level text)
language sql stable security invoker set search_path=public
as $$
select q.id,q.prompt,q.options,q.answer,q.explanation,q.difficulty,q.skill,q.question_type,q.interaction_config,q.hint,
 case q.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end,q.grade_level
from public.learning_questions q
where q.status='published'
  and q.question_type in ('visual_question','visual_table','number_line')
  and (q.grade_level is null or q.grade_level=(select p.grade from public.profiles p where p.id=(select auth.uid())))
order by random()
limit greatest(1,least(coalesce(p_limit,20),20));
$$;

revoke all on function public.get_visual_questions(integer) from public,anon;
grant execute on function public.get_visual_questions(integer) to authenticated;

-- Keep the visual/table answer comparison server-side.
-- The entitlement trigger on question_attempts enforces the daily quota.
