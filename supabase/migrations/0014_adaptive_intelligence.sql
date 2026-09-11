-- Phase 4.6: learner-aware adaptive question selection.
-- Uses topic mastery, recent attempts, consecutive results and difficulty progression.

create or replace function public.get_adaptive_learning_path(
  p_limit integer default 10,
  p_topic_id text default null
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
  media_url text,
  adaptive_reason text
)
language sql
security definer
set search_path=public
as $$
  with limits as (
    select greatest(1, least(coalesce(p_limit,10),20)) as n
  ),
  topic_mastery as (
    select tp.topic_id,
           round((tp.correct_answers::numeric / greatest(tp.questions_answered,1))*100) as mastery,
           tp.questions_answered
      from public.topic_progress tp
     where tp.user_id=auth.uid()
  ),
  attempted as (
    select qa.question_id,
           count(*) as attempts,
           count(*) filter (where qa.is_correct) as correct
      from public.question_attempts qa
     where qa.user_id=auth.uid()
     group by qa.question_id
  ),
  recent as (
    select qa.question_id,
           row_number() over (order by qa.created_at desc) as recent_rank
      from public.question_attempts qa
     where qa.user_id=auth.uid()
  ),
  candidates as (
    select q.id, q.topic_id, t.title as topic, q.prompt, q.options, q.answer, q.explanation,
           q.difficulty, q.skill,
           case q.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end as points,
           q.question_type, q.interaction_config, q.hint, q.animation, q.time_limit_seconds, q.media_url,
           coalesce(tm.mastery,0) as mastery,
           coalesce(a.attempts,0) as attempts,
           coalesce(r.recent_rank,999999) as recent_rank
      from public.learning_questions q
      join public.learning_topics t on t.id=q.topic_id
      left join topic_mastery tm on tm.topic_id=q.topic_id
      left join attempted a on a.question_id=q.id
      left join recent r on r.question_id=q.id
     where auth.uid() is not null
       and (p_topic_id is null or q.topic_id=p_topic_id)
  ),
  ranked as (
    select c.*,
      row_number() over (
        order by
          case
            when c.mastery < 50 and c.difficulty='easy' then 0
            when c.mastery between 50 and 69 and c.difficulty='medium' then 0
            when c.mastery between 70 and 89 and c.difficulty in ('medium','hard') then 0
            when c.mastery >= 90 and c.difficulty='hard' then 0
            else 1
          end,
          case when c.mastery < 60 then c.mastery else 100-c.mastery end asc,
          case when c.recent_rank <= 5 then 1 else 0 end asc,
          c.attempts asc,
          random()
      ) as rn
    from candidates c
  )
  select id, topic_id, topic, prompt, options, answer, explanation, difficulty, skill, points,
         question_type, interaction_config, hint, animation, time_limit_seconds, media_url,
         case
           when mastery < 50 then 'Remediation: strengthen this skill'
           when mastery < 70 then 'Practice: build consistency'
           when mastery < 90 then 'Progression: increase difficulty'
           else 'Challenge: extend mastery'
         end as adaptive_reason
    from ranked
   where rn <= (select n from limits)
   order by rn;
$$;

revoke all on function public.get_adaptive_learning_path(integer,text) from public, anon;
grant execute on function public.get_adaptive_learning_path(integer,text) to authenticated;
