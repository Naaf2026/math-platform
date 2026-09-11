-- ============================================================
-- FAHI VISSNUN Math Platform
-- Phase 4.6 — Daily Mission Adaptive Bridge
-- ============================================================
-- Keeps the existing Daily Mission RPC contract while routing
-- question selection through get_adaptive_learning_path().
-- This lets the existing learner UI use the new adaptive engine
-- without requiring a client-side schema change.
-- ============================================================

create or replace function public.get_adaptive_questions(
  p_limit integer default 10
)
returns table(
  id text,
  topic_id text,
  topic text,
  prompt text,
  options jsonb,
  answer text,
  explanation text,
  difficulty text,
  skill text,
  points integer,
  question_type text,
  interaction_config jsonb,
  hint text
)
language sql
security definer
set search_path=public
as $$
  select
    p.id,
    p.topic_id,
    p.topic,
    p.prompt,
    p.options,
    p.answer,
    p.explanation,
    p.difficulty,
    p.skill,
    p.points,
    p.question_type,
    p.interaction_config,
    p.hint
  from public.get_adaptive_learning_path(
    greatest(1, least(coalesce(p_limit, 10), 20)),
    null
  ) p;
$$;

revoke all
on function public.get_adaptive_questions(integer)
from public, anon;

grant execute
on function public.get_adaptive_questions(integer)
to authenticated;
