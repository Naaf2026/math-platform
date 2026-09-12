create table if not exists public.learning_levels (
  level integer primary key check (level >= 1), title text not null, min_xp integer not null check (min_xp >= 0), max_xp integer,
  icon text not null default '⭐', reward_metadata jsonb not null default '{}'::jsonb, active boolean not null default true,
  check (max_xp is null or max_xp >= min_xp)
);
insert into public.learning_levels(level,title,min_xp,max_xp,icon,reward_metadata,active) values
(1,'Beginner',0,99,'🌱','{"milestone":"Start your learning journey"}',true),(2,'Explorer',100,249,'🔎','{"milestone":"100 XP"}',true),(3,'Problem Solver',250,499,'🧩','{"milestone":"250 XP"}',true),(4,'Math Builder',500,849,'🏗️','{"milestone":"500 XP"}',true),(5,'Math Star',850,1299,'⭐','{"milestone":"850 XP"}',true),(6,'Skill Master',1300,1849,'🎯','{"milestone":"1300 XP"}',true),(7,'Math Champion',1850,2499,'🏆','{"milestone":"1850 XP"}',true),(8,'Learning Hero',2500,3249,'🦸','{"milestone":"2500 XP"}',true),(9,'Math Expert',3250,4099,'🧠','{"milestone":"3250 XP"}',true),(10,'Math Legend',4100,null,'👑','{"milestone":"4100 XP"}',true)
on conflict(level) do update set title=excluded.title,min_xp=excluded.min_xp,max_xp=excluded.max_xp,icon=excluded.icon,reward_metadata=excluded.reward_metadata,active=excluded.active;
create table if not exists public.learner_level_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  level integer not null references public.learning_levels(level), reached_at timestamptz not null default now(),
  xp_at_level integer not null default 0 check (xp_at_level >= 0), metadata jsonb not null default '{}'::jsonb,
  primary key(user_id,level)
);
alter table public.learning_levels enable row level security;
alter table public.learner_level_history enable row level security;
drop policy if exists "authenticated learners can view active levels" on public.learning_levels;
create policy "authenticated learners can view active levels" on public.learning_levels for select to authenticated using(active=true);
drop policy if exists "learners view own level history" on public.learner_level_history;
create policy "learners view own level history" on public.learner_level_history for select to authenticated using((select auth.uid())=user_id);
create index if not exists idx_learner_level_history_user_reached on public.learner_level_history(user_id,reached_at desc);
create or replace function public.get_my_level_progress()
returns table(lifetime_xp integer,current_level integer,level_title text,level_icon text,current_level_min_xp integer,next_level integer,next_level_min_xp integer,xp_into_level integer,xp_needed integer,progress_percent integer,next_level_title text,next_level_icon text)
language sql security invoker set search_path=public as $$
with wallet as (select greatest(coalesce(sr.lifetime_xp,0),coalesce(p.xp,0))::integer lifetime_xp from public.profiles p left join public.student_rewards sr on sr.user_id=p.id where p.id=(select auth.uid()) limit 1),
c as (select l.* from public.learning_levels l,wallet w where l.active and l.min_xp<=w.lifetime_xp order by l.min_xp desc limit 1),
n as (select l.* from public.learning_levels l,wallet w where l.active and l.min_xp>w.lifetime_xp order by l.min_xp asc limit 1)
select w.lifetime_xp,c.level,c.title,c.icon,c.min_xp,n.level,n.min_xp,greatest(0,w.lifetime_xp-c.min_xp),case when n.level is null then 0 else greatest(0,n.min_xp-w.lifetime_xp) end,case when n.level is null then 100 else least(100,greatest(0,round(((w.lifetime_xp-c.min_xp)::numeric/nullif(n.min_xp-c.min_xp,0))*100)::integer)) end,n.title,n.icon from wallet w cross join c left join n on true;
$$;
create or replace function public.get_my_level_history()
returns table(level integer,title text,icon text,reached_at timestamptz,xp_at_level integer,metadata jsonb)
language sql security invoker set search_path=public as $$
select h.level,l.title,l.icon,h.reached_at,h.xp_at_level,h.metadata from public.learner_level_history h join public.learning_levels l on l.level=h.level where h.user_id=(select auth.uid()) order by h.level desc;
$$;
create or replace function public.check_learning_level_up()
returns table(newly_reached_level integer,title text,icon text,xp_at_level integer,newly_earned boolean)
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_xp integer; v_level integer; v_title text; v_icon text; v_inserted_count integer;
begin
if v_uid is null then raise exception 'Authentication required'; end if;
select greatest(coalesce(sr.lifetime_xp,0),coalesce(p.xp,0)) into v_xp from public.profiles p left join public.student_rewards sr on sr.user_id=p.id where p.id=v_uid;
v_xp:=coalesce(v_xp,0);
select l.level,l.title,l.icon into v_level,v_title,v_icon from public.learning_levels l where l.active and l.min_xp<=v_xp order by l.min_xp desc limit 1;
if v_level is null then return; end if;
insert into public.learner_level_history(user_id,level,xp_at_level,metadata) values(v_uid,v_level,v_xp,jsonb_build_object('source','level_evaluation')) on conflict(user_id,level) do nothing;
get diagnostics v_inserted_count=row_count;
if v_inserted_count>0 then return query select v_level,v_title,v_icon,v_xp,true; end if;
end;
$$;
revoke all on function public.get_my_level_progress() from public,anon;
revoke all on function public.get_my_level_history() from public,anon;
revoke all on function public.check_learning_level_up() from public,anon;
grant execute on function public.get_my_level_progress() to authenticated;
grant execute on function public.get_my_level_history() to authenticated;
grant execute on function public.check_learning_level_up() to authenticated;
