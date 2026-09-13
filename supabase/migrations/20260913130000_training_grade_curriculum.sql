-- Grade-aware Training curriculum
alter table public.learning_topics add column if not exists grade_level text;
alter table public.learning_questions add column if not exists grade_level text;

update public.learning_topics
set grade_level = case
  when lower(coalesce(level,'')) like '%1%' then 'Grade 1'
  when lower(coalesce(level,'')) like '%2%' then 'Grade 2'
  when lower(coalesce(level,'')) like '%3%' then 'Grade 3'
  when lower(coalesce(level,'')) like '%4%' then 'Grade 4'
  when lower(coalesce(level,'')) like '%5%' then 'Grade 5'
  when lower(coalesce(level,'')) like '%6%' then 'Grade 6'
  when lower(coalesce(level,'')) like '%7%' then 'Grade 7'
  else 'Grade 3'
end
where grade_level is null;

update public.learning_questions q
set grade_level = coalesce(t.grade_level, 'Grade 3')
from public.learning_topics t
where q.topic_id = t.id and q.grade_level is null;

create index if not exists learning_questions_grade_topic_skill_idx on public.learning_questions (grade_level, topic_id, skill, difficulty);
create index if not exists learning_topics_grade_sort_idx on public.learning_topics (grade_level, sort_order);

create or replace function public.get_training_questions(p_grade_level text, p_topic_id text default null, p_skill text default null, p_difficulty text default null, p_limit integer default 100)
returns table(id text, topic_id text, topic text, prompt text, options jsonb, answer text, explanation text, difficulty text, skill text, points integer, question_type text, interaction_config jsonb, hint text, animation text, time_limit_seconds integer, media_url text)
language sql security definer set search_path = public, pg_temp
as $$
  select q.id, q.topic_id, t.title, q.prompt, q.options, q.answer, q.explanation, q.difficulty, q.skill,
    case when q.difficulty='easy' then 1 when q.difficulty='medium' then 2 when q.difficulty='hard' then 3 else 1 end,
    q.question_type, q.interaction_config, q.hint, q.animation, q.time_limit_seconds, q.media_url
  from public.learning_questions q
  left join public.learning_topics t on t.id=q.topic_id
  where q.grade_level=p_grade_level
    and coalesce(q.status,'published') in ('published','approved','active')
    and (p_topic_id is null or q.topic_id=p_topic_id)
    and (p_skill is null or q.skill=p_skill)
    and (p_difficulty is null or q.difficulty=p_difficulty)
  order by q.sort_order nulls last, q.created_at, q.id
  limit greatest(1, least(coalesce(p_limit,100),500));
$$;
grant execute on function public.get_training_questions(text,text,text,text,integer) to authenticated;

create or replace function public.save_training_question(
  p_id text, p_grade_level text, p_topic_id text, p_topic_title text, p_skill text, p_prompt text, p_answer text,
  p_explanation text default '', p_difficulty text default 'easy', p_question_type text default 'multiple_choice',
  p_options jsonb default '[]'::jsonb, p_interaction_config jsonb default '{}'::jsonb, p_hint text default null
)
returns text language plpgsql security definer set search_path=public, pg_temp
as $$
declare uid uuid:=auth.uid(); role_name text; v_topic_id text:=nullif(trim(p_topic_id),''); v_topic_title text:=nullif(trim(p_topic_title),''); v_id text:=nullif(trim(p_id),''); grade_num integer;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select role into role_name from public.user_roles where user_id=uid limit 1;
  if role_name not in ('teacher','admin') then raise exception 'Teacher or administrator access required'; end if;
  if p_grade_level not in ('Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7') then raise exception 'Invalid training grade'; end if;
  if p_difficulty not in ('easy','medium','hard') then raise exception 'Invalid difficulty'; end if;
  if length(trim(coalesce(p_prompt,'')))=0 or length(trim(coalesce(p_answer,'')))=0 then raise exception 'Question and answer are required'; end if;
  grade_num:=substring(p_grade_level from '[1-7]')::integer;
  if v_topic_id is not null then
    if not exists(select 1 from public.learning_topics where id=v_topic_id and grade_level=p_grade_level) then raise exception 'Selected topic does not belong to %',p_grade_level; end if;
  else
    if v_topic_title is null then raise exception 'Topic is required'; end if;
    select id into v_topic_id from public.learning_topics where grade_level=p_grade_level and lower(title)=lower(v_topic_title) limit 1;
    if v_topic_id is null then
      v_topic_id:='grade-'||grade_num::text||'-'||trim(both '-' from lower(regexp_replace(v_topic_title,'[^a-zA-Z0-9]+','-','g')));
      insert into public.learning_topics(id,title,description,level,lessons,sort_order,grade_level) values(v_topic_id,v_topic_title,'Training curriculum topic.',p_grade_level,1,999,p_grade_level) on conflict(id) do nothing;
    end if;
  end if;
  if v_id is null then
    v_id:='tr-'||replace(gen_random_uuid()::text,'-','');
    insert into public.learning_questions(id,topic_id,prompt,options,answer,explanation,sort_order,difficulty,skill,question_type,interaction_config,hint,animation,media_url,grade_level,subject,status,version,published_by)
    values(v_id,v_topic_id,trim(p_prompt),coalesce(p_options,'[]'::jsonb),trim(p_answer),coalesce(p_explanation,''),extract(epoch from clock_timestamp())::integer,p_difficulty,coalesce(nullif(trim(p_skill),''),'General'),p_question_type,coalesce(p_interaction_config,'{}'::jsonb),p_hint,'question-enter',null,p_grade_level,'Mathematics','draft',1,uid);
  else
    update public.learning_questions set topic_id=v_topic_id,prompt=trim(p_prompt),options=coalesce(p_options,'[]'::jsonb),answer=trim(p_answer),explanation=coalesce(p_explanation,''),difficulty=p_difficulty,skill=coalesce(nullif(trim(p_skill),''),'General'),question_type=p_question_type,interaction_config=coalesce(p_interaction_config,'{}'::jsonb),hint=p_hint,grade_level=p_grade_level,subject='Mathematics',version=version+1,updated_at=now() where id=v_id;
    if not found then raise exception 'Question not found'; end if;
  end if;
  return v_id;
end;
$$;
grant execute on function public.save_training_question(text,text,text,text,text,text,text,text,text,text,jsonb,jsonb,text) to authenticated;

create or replace function public.publish_training_question(p_id text)
returns boolean language plpgsql security definer set search_path=public, pg_temp
as $$
declare role_name text; uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select role into role_name from public.user_roles where user_id=uid limit 1;
  if role_name not in ('teacher','admin') then raise exception 'Teacher or administrator access required'; end if;
  update public.learning_questions set status='published',published_at=coalesce(published_at,now()),published_by=uid,updated_at=now() where id=p_id and status<>'archived';
  if not found then raise exception 'Question not found or archived'; end if;
  return true;
end;
$$;
grant execute on function public.publish_training_question(text) to authenticated;

-- Ensure AI-published questions retain their Grade and do not mix topics across grades.
create or replace function public.publish_ai_question(p_generated_question_id uuid)
returns text language plpgsql security definer set search_path=public, pg_temp
as $$
declare q public.ai_generated_questions%rowtype; new_id text; topic_id_value text; grade_label text; topic_title text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into q from public.ai_generated_questions where id=p_generated_question_id;
  if not found then raise exception 'Generated question not found'; end if;
  if q.validation_status<>'approved' then raise exception 'Question must be approved before publishing'; end if;
  grade_label:='Grade '||q.grade::text; topic_title:=coalesce(q.topic,q.skill,'AI Generated');
  select id into topic_id_value from public.learning_topics where lower(title)=lower(topic_title) and grade_level=grade_label order by sort_order,id limit 1;
  if topic_id_value is null then
    topic_id_value:='grade-'||q.grade::text||'-'||trim(both '-' from lower(regexp_replace(topic_title,'[^a-zA-Z0-9]+','-','g')));
    if topic_id_value='grade-'||q.grade::text||'-' then topic_id_value:='grade-'||q.grade::text||'-ai-generated'; end if;
    insert into public.learning_topics(id,title,description,level,lessons,sort_order,grade_level) values(topic_id_value,topic_title,'Curriculum-aligned learning topic.',grade_label,1,999,grade_label) on conflict(id) do nothing;
  end if;
  new_id:='ai-'||replace(q.id::text,'-','');
  insert into public.learning_questions(id,topic_id,prompt,options,answer,explanation,sort_order,difficulty,skill,question_type,interaction_config,hint,animation,media_url,grade_level,subject,status,version,source_ai_question_id,published_at,published_by)
  values(new_id,topic_id_value,q.prompt,q.options,q.correct_answer->>'value',coalesce(q.explanation,''),extract(epoch from clock_timestamp())::integer,q.difficulty,coalesce(q.skill,'curriculum'),q.question_type,q.interaction_config,q.hint,'question-enter',null,grade_label,coalesce(q.subject,'Mathematics'),'published',1,q.id,now(),auth.uid())
  on conflict(id) do update set grade_level=excluded.grade_level,status=excluded.status,version=public.learning_questions.version+1,updated_at=now(),topic_id=excluded.topic_id;
  update public.ai_generated_questions set approved_at=coalesce(approved_at,now()),approved_by=auth.uid() where id=q.id;
  return new_id;
end;
$$;
grant execute on function public.publish_ai_question(uuid) to authenticated;
