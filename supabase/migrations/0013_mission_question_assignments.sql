-- Phase 4.5: explicit mission assignment with adaptive fallback.
-- Safe to run repeatedly. Existing missions continue to work through the adaptive RPC.

create table if not exists public.mission_question_assignments (
  mission_key text not null,
  question_id text not null references public.learning_questions(id) on delete cascade,
  priority integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (mission_key, question_id)
);

create index if not exists mission_question_assignments_lookup_idx
  on public.mission_question_assignments (mission_key, active, priority);

alter table public.mission_question_assignments enable row level security;
revoke all on table public.mission_question_assignments from anon;
grant select on table public.mission_question_assignments to authenticated;

drop policy if exists "Authenticated users can read mission assignments" on public.mission_question_assignments;
create policy "Authenticated users can read mission assignments"
  on public.mission_question_assignments
  for select to authenticated using (true);

-- Mission selection first uses explicitly assigned published questions.
-- If fewer than the requested number are assigned, adaptive questions fill the remainder.
drop function if exists public.get_mission_questions(text, integer);
create function public.get_mission_questions(
  p_mission_key text default 'daily',
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
  hint text,
  animation text,
  time_limit_seconds integer,
  media_url text
)
language sql
security definer
set search_path=public
as $$
  with requested as (
    select greatest(1, least(coalesce(p_limit,10),20)) as n
  ),
  assigned as (
    select q.id, q.topic_id, t.title as topic, q.prompt, q.options, q.answer, q.explanation,
           q.difficulty, q.skill,
           case q.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end as points,
           q.question_type, q.interaction_config, q.hint, q.animation, q.time_limit_seconds, q.media_url,
           row_number() over (order by a.priority asc, a.created_at asc) as rn
      from public.mission_question_assignments a
      join public.learning_questions q on q.id=a.question_id
      join public.learning_topics t on t.id=q.topic_id
     where a.mission_key=coalesce(nullif(trim(p_mission_key),''),'daily')
       and a.active
  ),
  assigned_limited as (
    select * from assigned where rn <= (select n from requested)
  ),
  adaptive as (
    select q.id, q.topic_id, t.title as topic, q.prompt, q.options, q.answer, q.explanation,
           q.difficulty, q.skill,
           case q.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end as points,
           q.question_type, q.interaction_config, q.hint, q.animation, q.time_limit_seconds, q.media_url,
           coalesce(tp.accuracy,0) as accuracy,
           case when exists (
             select 1 from public.question_attempts qa
              where qa.user_id=auth.uid() and qa.question_id=q.id
           ) then 1 else 0 end as attempted
      from public.learning_questions q
      join public.learning_topics t on t.id=q.topic_id
      left join (
        select topic_id, round((correct_answers::numeric/greatest(questions_answered,1))*100) as accuracy
          from public.topic_progress where user_id=auth.uid()
      ) tp on tp.topic_id=q.topic_id
     where auth.uid() is not null
       and not exists (
         select 1 from assigned_limited al where al.id=q.id
       )
  ),
  ranked_adaptive as (
    select a.*, row_number() over (
      order by a.accuracy asc, a.attempted asc,
        case
          when a.accuracy < 60 and a.difficulty='easy' then 0
          when a.accuracy between 60 and 79 and a.difficulty='medium' then 0
          when a.accuracy >= 80 and a.difficulty='hard' then 0
          else 1
        end,
        random()
    ) as rn
    from adaptive a
  ),
  combined as (
    select id,topic_id,topic,prompt,options,answer,explanation,difficulty,skill,points,
           question_type,interaction_config,hint,animation,time_limit_seconds,media_url,rn as sort_rank
      from assigned_limited
    union all
    select id,topic_id,topic,prompt,options,answer,explanation,difficulty,skill,points,
           question_type,interaction_config,hint,animation,time_limit_seconds,media_url,
           (select count(*) from assigned_limited)+rn as sort_rank
      from ranked_adaptive
     where rn <= (select n from requested) - (select count(*) from assigned_limited)
  )
  select id,topic_id,topic,prompt,options,answer,explanation,difficulty,skill,points,
         question_type,interaction_config,hint,animation,time_limit_seconds,media_url
    from combined
   order by sort_rank;
$$;

revoke all on function public.get_mission_questions(text, integer) from public, anon;
grant execute on function public.get_mission_questions(text, integer) to authenticated;

-- Seed a few stable daily assignments from the existing interactive bank.
insert into public.mission_question_assignments (mission_key, question_id, priority)
select 'daily', id, row_number() over (order by sort_order, id)
  from public.learning_questions
 where id in ('pv-3','as-nl-1','pv-man-1','as-man-1','mul-man-1')
on conflict (mission_key, question_id) do update set priority=excluded.priority, active=true;
