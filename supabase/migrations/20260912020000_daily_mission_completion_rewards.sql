create table if not exists public.daily_mission_rewards (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null unique references public.daily_missions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_date date not null,
  base_xp integer not null default 0 check (base_xp >= 0),
  completion_bonus_xp integer not null default 25 check (completion_bonus_xp >= 0),
  perfect_bonus_xp integer not null default 0 check (perfect_bonus_xp >= 0),
  streak_bonus_xp integer not null default 0 check (streak_bonus_xp >= 0),
  total_reward_xp integer not null default 0 check (total_reward_xp >= 0),
  streak_at_completion integer not null default 0 check (streak_at_completion >= 0),
  reward_claimed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, mission_date)
);

create index if not exists daily_mission_rewards_user_date_idx
  on public.daily_mission_rewards(user_id, mission_date desc);

alter table public.daily_mission_rewards enable row level security;

drop policy if exists daily_mission_rewards_select_own on public.daily_mission_rewards;
create policy daily_mission_rewards_select_own
  on public.daily_mission_rewards for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.daily_mission_rewards from anon, authenticated;
grant select on public.daily_mission_rewards to authenticated;

create or replace function public.complete_daily_mission_reward()
returns table (
  mission_id uuid, mission_date date, completed_questions integer,
  target_questions integer, correct_questions integer, base_xp integer,
  completion_bonus_xp integer, perfect_bonus_xp integer, streak_bonus_xp integer,
  total_reward_xp integer, streak integer, already_claimed boolean
)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_mission public.daily_missions%rowtype;
  v_reward public.daily_mission_rewards%rowtype;
  v_streak integer := 0;
  v_base integer := 0;
  v_completion integer := 25;
  v_perfect integer := 0;
  v_streak_bonus integer := 0;
  v_total integer := 0;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_mission from public.daily_missions
  where user_id = v_user and mission_date = current_date for update;
  if not found then raise exception 'No daily mission found'; end if;
  if v_mission.status <> 'completed' then raise exception 'Daily mission is not completed'; end if;

  select * into v_reward from public.daily_mission_rewards where mission_id = v_mission.id;
  if found then
    return query select v_reward.mission_id, v_reward.mission_date,
      v_mission.completed_questions, v_mission.target_questions, v_mission.correct_questions,
      v_reward.base_xp, v_reward.completion_bonus_xp, v_reward.perfect_bonus_xp,
      v_reward.streak_bonus_xp, v_reward.total_reward_xp, v_reward.streak_at_completion, true;
    return;
  end if;

  select coalesce(current_streak, 0) into v_streak
  from public.profiles where id = v_user for update;

  v_base := greatest(0, coalesce(v_mission.xp_earned, 0));
  v_perfect := case when v_mission.completed_questions >= v_mission.target_questions
    and v_mission.correct_questions >= v_mission.target_questions then 25 else 0 end;
  v_streak_bonus := least(50, greatest(0, v_streak) * 5);
  v_total := v_completion + v_perfect + v_streak_bonus;

  insert into public.daily_mission_rewards (
    mission_id, user_id, mission_date, base_xp, completion_bonus_xp,
    perfect_bonus_xp, streak_bonus_xp, total_reward_xp, streak_at_completion
  ) values (
    v_mission.id, v_user, v_mission.mission_date, v_base, v_completion,
    v_perfect, v_streak_bonus, v_total, v_streak
  ) on conflict (mission_id) do nothing returning * into v_reward;

  if not found then
    select * into v_reward from public.daily_mission_rewards where mission_id = v_mission.id;
  else
    update public.profiles set xp = coalesce(xp, 0) + v_reward.total_reward_xp, updated_at = now()
    where id = v_user;
    begin perform public.refresh_learning_achievements(); exception when others then null; end;
  end if;

  return query select v_reward.mission_id, v_reward.mission_date,
    v_mission.completed_questions, v_mission.target_questions, v_mission.correct_questions,
    v_reward.base_xp, v_reward.completion_bonus_xp, v_reward.perfect_bonus_xp,
    v_reward.streak_bonus_xp, v_reward.total_reward_xp, v_reward.streak_at_completion, false;
end;
$$;

revoke all on function public.complete_daily_mission_reward() from public, anon;
grant execute on function public.complete_daily_mission_reward() to authenticated;

create or replace function public.get_daily_mission_reward(p_mission_id uuid default null)
returns table (
  mission_id uuid, mission_date date, base_xp integer, completion_bonus_xp integer,
  perfect_bonus_xp integer, streak_bonus_xp integer, total_reward_xp integer,
  streak integer, reward_claimed_at timestamptz
)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_mission uuid := p_mission_id;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if v_mission is null then
    select id into v_mission from public.daily_missions
    where user_id = v_user and mission_date = current_date;
  end if;
  return query select r.mission_id, r.mission_date, r.base_xp, r.completion_bonus_xp,
    r.perfect_bonus_xp, r.streak_bonus_xp, r.total_reward_xp,
    r.streak_at_completion, r.reward_claimed_at
  from public.daily_mission_rewards r
  where r.mission_id = v_mission and r.user_id = v_user;
end;
$$;

revoke all on function public.get_daily_mission_reward(uuid) from public, anon;
grant execute on function public.get_daily_mission_reward(uuid) to authenticated;
