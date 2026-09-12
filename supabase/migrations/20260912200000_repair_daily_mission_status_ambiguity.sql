-- Fix Daily Mission RPC failure caused by the output-column name `status`
-- colliding with the daily_missions.status column inside PL/pgSQL.
create or replace function public.get_daily_mission(p_target_questions integer default 10)
returns table(
  mission_id uuid,
  mission_date date,
  status text,
  target_questions integer,
  completed_questions integer,
  correct_questions integer,
  xp_earned integer,
  question_id text,
  question_position integer,
  prompt text,
  options jsonb,
  answer text,
  explanation text,
  difficulty text,
  skill text,
  question_type text,
  interaction_config jsonb,
  hint text,
  animation text,
  time_limit_seconds integer,
  media_url text,
  answered_at timestamptz,
  is_correct boolean,
  xp_awarded integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_mission uuid;
  v_status text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  v_mission := public.get_or_create_daily_mission(coalesce(p_target_questions, 10));

  select m.status
    into v_status
    from public.daily_missions as m
   where m.id = v_mission
     and m.user_id = v_user;

  return query
  select
    m.id,
    m.mission_date,
    m.status,
    m.target_questions,
    m.completed_questions,
    m.correct_questions,
    m.xp_earned,
    q.id,
    dmq.position,
    q.prompt,
    q.options,
    q.answer,
    q.explanation,
    q.difficulty,
    q.skill,
    q.question_type,
    q.interaction_config,
    q.hint,
    q.animation,
    q.time_limit_seconds,
    q.media_url,
    dmq.answered_at,
    dmq.is_correct,
    dmq.xp_awarded
  from public.daily_missions as m
  join public.daily_mission_questions as dmq
    on dmq.mission_id = m.id
  join public.learning_questions as q
    on q.id = dmq.question_id
  where m.id = v_mission
    and (v_status = 'completed' or dmq.answered_at is null)
  order by dmq.position
  limit case when v_status = 'completed' then 1 else 2147483647 end;
end;
$$;

revoke all on function public.get_daily_mission(integer) from public, anon;
grant execute on function public.get_daily_mission(integer) to authenticated;

notify pgrst, 'reload schema';
