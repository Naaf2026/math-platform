-- Textbook-driven visual Daily Challenge questions.
-- Generated textbook questions carry grade/source metadata so the adaptive
-- challenge can prefer the learner's grade without disturbing legacy questions.

alter table public.learning_questions
  add column if not exists grade integer,
  add column if not exists source_book_id uuid references public.books(id) on delete set null,
  add column if not exists source_chapter_id uuid references public.book_chapters(id) on delete set null,
  add column if not exists source_page_start integer,
  add column if not exists source_page_end integer;

create index if not exists learning_questions_grade_idx
  on public.learning_questions(grade, difficulty, topic_id);

create index if not exists learning_questions_source_book_idx
  on public.learning_questions(source_book_id, source_page_start, source_page_end);

-- Keep the existing function contract used by the Daily Challenge UI, while
-- preferring textbook questions for the learner's own grade.
create or replace function public.get_adaptive_questions(p_limit integer default 10)
returns table(id text, topic_id text, topic text, prompt text, options jsonb, answer text, explanation text, difficulty text, skill text, points integer)
language sql
security definer
set search_path=public
as $$
  with learner as (
    select nullif(regexp_replace(coalesce(p.grade,''), '[^0-9]', '', 'g'), '')::integer as grade
      from public.profiles p
     where p.id=auth.uid()
  ),
  topic_stats as (
    select t.id as topic_id,
           case when coalesce(tp.questions_answered,0)=0 then 0
                else round((tp.correct_answers::numeric / tp.questions_answered::numeric)*100) end as accuracy
      from public.learning_topics t
      left join public.topic_progress tp on tp.topic_id=t.id and tp.user_id=auth.uid()
  ),
  candidates as (
    select q.id,q.topic_id,t.title as topic,q.prompt,q.options,q.answer,q.explanation,q.difficulty,q.skill,
           case q.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end as points,
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
  select id,topic_id,topic,prompt,options,answer,explanation,difficulty,skill,points
    from ranked
   order by mission_rank
   limit greatest(1,least(coalesce(p_limit,10),20));
$$;

revoke all on function public.get_adaptive_questions(integer) from public,anon;
grant execute on function public.get_adaptive_questions(integer) to authenticated;

-- Extend the existing AI publication bridge with textbook provenance.
create or replace function public.publish_ai_question(p_generated_question_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.ai_generated_questions%rowtype;
  new_id text;
  topic_id_value text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into q from public.ai_generated_questions where id = p_generated_question_id;
  if not found then raise exception 'Generated question not found'; end if;
  if q.validation_status <> 'approved' then raise exception 'Question must be approved before publishing'; end if;

  topic_id_value := lower(regexp_replace(coalesce(q.topic, q.skill, 'ai-generated'), '[^a-zA-Z0-9]+', '-', 'g'));
  topic_id_value := trim(both '-' from topic_id_value);
  if topic_id_value = '' then topic_id_value := 'ai-generated'; end if;

  insert into public.learning_topics(id, title, description, level, lessons, sort_order)
  values (topic_id_value, coalesce(q.topic, q.skill, 'AI Generated'), 'Curriculum-aligned AI generated learning topic.', case when q.grade <= 4 then 'Foundation' else 'Development' end, 1, 999)
  on conflict (id) do nothing;

  new_id := 'ai-' || replace(q.id::text, '-', '');
  insert into public.learning_questions(
    id, topic_id, prompt, options, answer, explanation, sort_order,
    difficulty, skill, question_type, interaction_config, hint, animation, media_url,
    grade, source_book_id, source_chapter_id, source_page_start, source_page_end
  ) values (
    new_id, topic_id_value, q.prompt, q.options, q.correct_answer->>'value', coalesce(q.explanation, ''),
    extract(epoch from clock_timestamp())::integer, q.difficulty, coalesce(q.skill, 'curriculum'),
    q.question_type, q.interaction_config, q.hint, 'question-enter', null,
    q.grade, q.book_id, q.chapter_id,
    case when jsonb_typeof(q.source_reference)='object' then nullif((q.source_reference->>'page_start'), '')::integer else null end,
    case when jsonb_typeof(q.source_reference)='object' then nullif((q.source_reference->>'page_end'), '')::integer else null end
  ) on conflict (id) do nothing;

  update public.ai_generated_questions
     set approved_at = coalesce(approved_at, now()), approved_by = auth.uid()
   where id = q.id;
  return new_id;
end;
$$;

revoke all on function public.publish_ai_question(uuid) from public, anon;
grant execute on function public.publish_ai_question(uuid) to authenticated;
