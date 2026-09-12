-- Repair Daily Mission question assignment so every active mission gets a full
-- question set from published questions, even when the learner has recently
-- attempted many questions.
create or replace function public.get_or_create_daily_mission(p_target_questions integer default 10)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_mission uuid;
  v_status text;
  v_target integer := greatest(1, least(coalesce(p_target_questions, 10), 20));
  v_assigned integer := 0;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select id, status, target_questions
    into v_mission, v_status, v_target
    from public.daily_missions
   where user_id = v_user
     and mission_date = current_date
   limit 1;

  if v_mission is null then
    insert into public.daily_missions(user_id, mission_date, target_questions)
    values (v_user, current_date, greatest(1, least(coalesce(p_target_questions, 10), 20)))
    returning id, target_questions into v_mission, v_target;
  elsif v_status = 'completed' then
    return v_mission;
  end if;

  select count(*)
    into v_assigned
    from public.daily_mission_questions
   where mission_id = v_mission;

  -- Older missions may have been created with too few/no questions. Fill the
  -- missing slots instead of leaving the learner on an empty mission.
  if v_assigned < v_target then
    insert into public.daily_mission_questions(mission_id, question_id, position)
    select v_mission, candidate.id,
           v_assigned + row_number() over (order by candidate.recent_attempt_rank, candidate.mastery, random())::int
      from (
        select q.id,
               case when exists (
                 select 1
                   from public.question_attempts a
                  where a.user_id = v_user
                    and a.question_id = q.id
                    and a.created_at >= now() - interval '24 hours'
               ) then 1 else 0 end as recent_attempt_rank,
               coalesce(tp.mastery, 0) as mastery
          from public.learning_questions q
          left join public.topic_progress tp
            on tp.user_id = v_user
           and tp.topic_id = q.topic_id
         where q.status = 'published'
           and not exists (
             select 1
               from public.daily_mission_questions existing
              where existing.mission_id = v_mission
                and existing.question_id = q.id
           )
      ) candidate
     order by candidate.recent_attempt_rank, candidate.mastery, random()
     limit greatest(0, v_target - v_assigned);
  end if;

  return v_mission;
end;
$$;

revoke all on function public.get_or_create_daily_mission(integer) from public, anon;
grant execute on function public.get_or_create_daily_mission(integer) to authenticated;

notify pgrst, 'reload schema';
