-- Revision uses its tagged bank first, then fills the paper from published,
-- answerable questions of the learner's grade. Grade 1 currently has no
-- revision-tagged questions, so the previous selector returned zero.
create or replace function public.get_revision_questions(
  p_grade_level text,
  p_limit integer default 12
)
returns table (
  id text, topic_id text, prompt text, options jsonb, answer text,
  explanation text, difficulty text, skill text, question_type text,
  interaction_config jsonb, hint text, media_url text,
  grade_level text, from_mistake boolean
)
language sql
security definer
set search_path to 'public', 'pg_temp'
as $function$
  with latest_attempt as (
    select distinct on (qa.question_id)
      qa.question_id, qa.is_correct, qa.created_at
    from public.question_attempts qa
    where qa.user_id = auth.uid()
    order by qa.question_id, qa.created_at desc
  ),
  mistakes as (
    select q.id, q.topic_id, q.prompt, q.options, q.answer,
      q.explanation, q.difficulty, q.skill, q.question_type,
      q.interaction_config, q.hint, q.media_url, q.grade_level,
      true as from_mistake, la.created_at as priority_at
    from latest_attempt la
    join public.learning_questions q on q.id = la.question_id
    where la.is_correct = false
      and q.status = 'published'
      and q.grade_level = p_grade_level
      and q.question_type in ('multiple_choice', 'true_false', 'number_input', 'text_input')
      and nullif(trim(q.prompt), '') is not null
      and nullif(trim(q.answer), '') is not null
      and (q.question_type <> 'multiple_choice' or
        case when jsonb_typeof(q.options) = 'array' then jsonb_array_length(q.options) >= 2 else false end)
  ),
  mistake_pick as (
    select * from mistakes order by priority_at desc limit least(greatest(p_limit, 0), 4)
  ),
  eligible as (
    select q.id, q.topic_id, q.prompt, q.options, q.answer,
      q.explanation, q.difficulty, q.skill, q.question_type,
      q.interaction_config, q.hint, q.media_url, q.grade_level,
      false as from_mistake, q.created_at as priority_at,
      row_number() over (partition by q.skill order by random()) as skill_rank,
      case when q.tags ? 'revision' then 0 else 1 end as tag_rank
    from public.learning_questions q
    where auth.uid() is not null
      and q.status = 'published'
      and q.grade_level = p_grade_level
      and q.question_type in ('multiple_choice', 'true_false', 'number_input', 'text_input')
      and nullif(trim(q.prompt), '') is not null
      and nullif(trim(q.answer), '') is not null
      and (q.question_type <> 'multiple_choice' or
        case when jsonb_typeof(q.options) = 'array' then jsonb_array_length(q.options) >= 2 else false end)
      and not exists (select 1 from mistake_pick m where m.id = q.id)
  ),
  filler as (
    select id, topic_id, prompt, options, answer, explanation,
      difficulty, skill, question_type, interaction_config, hint,
      media_url, grade_level, from_mistake, priority_at
    from eligible
    order by skill_rank, tag_rank, random()
    limit greatest(p_limit - (select count(*) from mistake_pick), 0)
  )
  select id, topic_id, prompt, options, answer, explanation,
    difficulty, skill, question_type, interaction_config, hint,
    media_url, grade_level, from_mistake
  from ((select * from mistake_pick) union all (select * from filler)) x
  limit greatest(p_limit, 0);
$function$;

revoke all on function public.get_revision_questions(text, integer) from public, anon;
grant execute on function public.get_revision_questions(text, integer) to authenticated;
