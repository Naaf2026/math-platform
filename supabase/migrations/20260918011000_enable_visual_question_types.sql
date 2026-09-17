-- Enable the textbook visual question types and expose their renderer data
-- through the Daily Challenge adaptive RPC.

alter table public.learning_questions
  drop constraint if exists learning_questions_question_type_check;

alter table public.learning_questions
  add constraint learning_questions_question_type_check
  check (question_type in (
    'multiple_choice','number_input','text_input','true_false','ordering',
    'drag_drop','number_line','manipulatives','geometry','timed_challenge',
    'visual_question','visual_table'
  ));

-- The earlier interactive RPC already exposed these fields, but this migration
-- also adds grade-aware prioritisation introduced for textbook questions.
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
  with learner as (
    select nullif(regexp_replace(coalesce(p.grade,''), '[^0-9]', '', 'g'), '')::integer as grade
      from public.profiles p where p.id=auth.uid()
  ),
  topic_stats as (
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
           case when q.grade is not null and q.grade=(select grade from learner) then 0 else 1 end as grade_rank,
           case when not exists (select 1 from public.question_attempts a where a.user_id=auth.uid() and a.question_id=q.id) then 0 else 1 end as attempted_rank,
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
       and (q.grade is null or q.grade=(select grade from learner))
  ),
  ranked as (
    select c.*,row_number() over(order by c.grade_rank,c.accuracy asc,c.attempted_rank,c.difficulty_rank,random()) as mission_rank
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
