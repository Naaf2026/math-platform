-- Phase 5: interactive question schema.
-- Adds data-driven interaction metadata while keeping all existing questions compatible.

alter table public.learning_questions
  add column if not exists question_type text not null default 'multiple_choice',
  add column if not exists interaction_config jsonb not null default '{}'::jsonb,
  add column if not exists hint text,
  add column if not exists animation text not null default 'question-enter',
  add column if not exists time_limit_seconds integer,
  add column if not exists media_url text;

alter table public.learning_questions
drop constraint if exists learning_questions_question_type_check;

alter table public.learning_questions
add constraint learning_questions_question_type_check
check (question_type in (
  'multiple_choice',
  'number_input',
  'text_input',
  'true_false',
  'ordering',
  'drag_drop',
  'number_line',
  'manipulatives',
  'geometry',
  'timed_challenge'
));

alter table public.learning_questions
drop constraint if exists learning_questions_time_limit_check;

alter table public.learning_questions
add constraint learning_questions_time_limit_check
check (time_limit_seconds is null or time_limit_seconds between 5 and 600);

alter table public.learning_questions
drop constraint if exists learning_questions_interaction_config_object_check;

alter table public.learning_questions
add constraint learning_questions_interaction_config_object_check
check (jsonb_typeof(interaction_config) = 'object');

-- First real interactive question: numeric response.
update public.learning_questions
set question_type = 'number_input',
    interaction_config = '{"inputMode":"numeric","placeholder":"?","allowDecimal":false}'::jsonb,
    hint = 'Look at the hundreds place.',
    animation = 'question-enter'
where id = 'pv-3';

-- The adaptive RPC must expose the interaction metadata to the client.
drop function if exists public.get_adaptive_questions(integer);

create function public.get_adaptive_questions(p_limit integer default 10)
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
  with topic_stats as (
    select t.id as topic_id,
           case when coalesce(tp.questions_answered,0)=0 then 0
                else round((tp.correct_answers::numeric / tp.questions_answered::numeric)*100) end as accuracy
      from public.learning_topics t
      left join public.topic_progress tp on tp.topic_id=t.id and tp.user_id=auth.uid()
  ),
  candidates as (
    select q.id,q.topic_id,t.title as topic,q.prompt,q.options,q.answer,q.explanation,
           q.difficulty,q.skill,
           case q.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end as points,
           q.question_type,q.interaction_config,q.hint,q.animation,q.time_limit_seconds,q.media_url,
           coalesce(s.accuracy,0) as accuracy,
           case
             when not exists (select 1 from public.question_attempts a where a.user_id=auth.uid() and a.question_id=q.id) then 0
             else 1 end as attempted_rank,
           case
             when coalesce(s.accuracy,0) < 60 and q.difficulty='easy' then 0
             when coalesce(s.accuracy,0) < 60 and q.difficulty='medium' then 1
             when coalesce(s.accuracy,0) between 60 and 79 and q.difficulty='medium' then 0
             when coalesce(s.accuracy,0) between 60 and 79 and q.difficulty='easy' then 1
             when coalesce(s.accuracy,0) >= 80 and q.difficulty='hard' then 0
             when coalesce(s.accuracy,0) >= 80 and q.difficulty='medium' then 1
             else 2 end as difficulty_rank
      from public.learning_questions q
      join public.learning_topics t on t.id=q.topic_id
      join topic_stats s on s.topic_id=q.topic_id
     where auth.uid() is not null
  ),
  ranked as (
    select c.*,row_number() over(order by c.accuracy asc,c.attempted_rank,c.difficulty_rank,random()) as mission_rank
      from candidates c
  )
  select id,topic_id,topic,prompt,options,answer,explanation,difficulty,skill,points,
         question_type,interaction_config,hint,animation,time_limit_seconds,media_url
    from ranked
   order by mission_rank
   limit greatest(1,least(coalesce(p_limit,10),20));
$$;

revoke all on function public.get_adaptive_questions(integer) from public,anon;
grant execute on function public.get_adaptive_questions(integer) to authenticated;
