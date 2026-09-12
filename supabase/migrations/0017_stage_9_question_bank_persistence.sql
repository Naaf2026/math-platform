-- Stage 9: persistent Question Bank + AI publish bridge
-- Applied to Supabase project ksvmwiaaawzlhpoahjhp.

alter table public.learning_questions
  add column if not exists title text,
  add column if not exists subject text not null default 'Mathematics',
  add column if not exists status text not null default 'published',
  add column if not exists version integer not null default 1,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists mission_ids jsonb not null default '[]'::jsonb,
  add column if not exists usage_count integer not null default 0,
  add column if not exists correct_count integer not null default 0,
  add column if not exists source_ai_question_id uuid,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.learning_questions
set title = coalesce(nullif(title,''), left(prompt,72)),
    published_at = coalesce(published_at, now())
where title is null or title = '' or published_at is null;

alter table public.learning_questions drop constraint if exists learning_questions_status_check;
alter table public.learning_questions add constraint learning_questions_status_check check (status in ('draft','published','archived'));
alter table public.learning_questions drop constraint if exists learning_questions_version_check;
alter table public.learning_questions add constraint learning_questions_version_check check (version >= 1);

create unique index if not exists learning_questions_source_ai_unique on public.learning_questions(source_ai_question_id) where source_ai_question_id is not null;
create index if not exists learning_questions_status_topic_idx on public.learning_questions(status, topic_id);
create index if not exists learning_questions_source_ai_idx on public.learning_questions(source_ai_question_id);

alter table public.learning_questions enable row level security;
revoke all on public.learning_questions from anon;
grant select on public.learning_questions to authenticated;

drop policy if exists "published questions are learner readable" on public.learning_questions;
create policy "published questions are learner readable" on public.learning_questions for select to authenticated using (
  status = 'published' or exists (select 1 from public.user_roles ur where ur.user_id=(select auth.uid()) and ur.role in ('teacher','admin'))
);

create or replace function public.publish_ai_question_to_question_bank(p_question_id uuid,p_topic_id text default null)
returns table(question_id text,source_ai_question_id uuid,status text,version integer,topic_id text,message text)
language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid(); v_ai public.ai_generated_questions%rowtype; v_validation public.question_validation_results%rowtype; v_topic_id text; v_topic_title text; v_id text; v_existing_id text;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.user_roles where user_id=v_user and role in ('teacher','admin')) then raise exception 'Teacher or admin access required'; end if;
 select * into v_ai from public.ai_generated_questions where id=p_question_id;
 if not found then raise exception 'Generated question not found'; end if;
 if v_ai.validation_status <> 'approved' then raise exception 'Question must be approved in the AI review workspace before publishing'; end if;
 select * into v_validation from public.question_validation_results where generated_question_id=p_question_id order by created_at desc limit 1;
 if not found then raise exception 'Deterministic validation result is required before publishing'; end if;
 if not coalesce(v_validation.mathematically_correct,false) or not coalesce(v_validation.answer_valid,false) or not coalesce(v_validation.grade_appropriate,false) or not coalesce(v_validation.age_appropriate,false) or not coalesce(v_validation.curriculum_aligned,false) or not coalesce(v_validation.difficulty_valid,false) or coalesce(v_validation.duplicate_detected,false) then raise exception 'Question failed deterministic validation and cannot be published'; end if;
 if p_topic_id is not null then select id,title into v_topic_id,v_topic_title from public.learning_topics where id=p_topic_id;
 else select id,title into v_topic_id,v_topic_title from public.learning_topics where lower(title)=lower(v_ai.topic) or lower(id)=lower(v_ai.topic) order by case when lower(id)=lower(v_ai.topic) then 0 else 1 end limit 1; end if;
 if v_topic_id is null then raise exception 'A valid learning topic is required. Match the generated topic to an existing learning topic.'; end if;
 select id into v_existing_id from public.learning_questions where source_ai_question_id=p_question_id;
 v_id:=coalesce(v_existing_id,'ai-'||replace(p_question_id::text,'-',''));
 insert into public.learning_questions(id,topic_id,prompt,options,answer,explanation,sort_order,difficulty,skill,question_type,interaction_config,hint,animation,time_limit_seconds,media_url,title,subject,status,version,tags,mission_ids,usage_count,correct_count,source_ai_question_id,published_at,published_by,updated_at)
 values(v_id,v_topic_id,v_ai.prompt,coalesce(v_ai.options,'[]'::jsonb),coalesce(v_ai.correct_answer #>> '{}',v_ai.correct_answer::text),coalesce(v_ai.explanation,''),999999,case v_ai.difficulty when 'easy' then 'easy' when 'medium' then 'medium' else 'hard' end,coalesce(v_ai.skill,v_ai.topic),coalesce(v_ai.question_type,'multiple_choice'),case when jsonb_typeof(coalesce(v_ai.interaction_config,'{}'::jsonb))='object' then coalesce(v_ai.interaction_config,'{}'::jsonb) else '{}'::jsonb end,v_ai.hint,null,null,null,left(v_ai.prompt,72),coalesce(v_ai.subject,'Mathematics'),'published',case when v_existing_id is null then 1 else (select version+1 from public.learning_questions where id=v_existing_id) end,'[]'::jsonb,'[]'::jsonb,case when v_existing_id is null then 0 else (select usage_count from public.learning_questions where id=v_existing_id) end,case when v_existing_id is null then 0 else (select correct_count from public.learning_questions where id=v_existing_id) end,p_question_id,now(),v_user,now())
 on conflict(id) do update set topic_id=excluded.topic_id,prompt=excluded.prompt,options=excluded.options,answer=excluded.answer,explanation=excluded.explanation,difficulty=excluded.difficulty,skill=excluded.skill,question_type=excluded.question_type,interaction_config=excluded.interaction_config,hint=excluded.hint,title=excluded.title,subject=excluded.subject,status='published',version=public.learning_questions.version+1,published_at=now(),published_by=v_user,updated_at=now();
 update public.ai_generated_questions set approved_at=coalesce(approved_at,now()),approved_by=coalesce(approved_by,v_user) where id=p_question_id;
 return query select q.id,q.source_ai_question_id,q.status,q.version,q.topic_id,'Published to the persistent Question Bank and Adaptive Learning pool.'::text from public.learning_questions q where q.id=v_id;
end;
$$;
revoke all on function public.publish_ai_question_to_question_bank(uuid,text) from public,anon;
grant execute on function public.publish_ai_question_to_question_bank(uuid,text) to authenticated;

-- Adaptive engine now consumes only published Question Bank content.
create or replace function public.get_adaptive_learning_path(p_limit integer default 10,p_topic_id text default null)
returns table(id text,topic_id text,topic text,prompt text,options jsonb,answer text,explanation text,difficulty text,skill text,points integer,question_type text,interaction_config jsonb,hint text,animation text,time_limit_seconds integer,media_url text,adaptive_reason text)
language sql security definer set search_path=public
as $$
with limits as(select greatest(1,least(coalesce(p_limit,10),20)) n),topic_mastery as(select tp.topic_id,round((tp.correct_answers::numeric/greatest(tp.questions_answered,1))*100) mastery,tp.questions_answered from public.topic_progress tp where tp.user_id=auth.uid()),attempted as(select qa.question_id,count(*) attempts,count(*) filter(where qa.is_correct) correct from public.question_attempts qa where qa.user_id=auth.uid() group by qa.question_id),recent as(select qa.question_id,row_number() over(order by qa.created_at desc) recent_rank from public.question_attempts qa where qa.user_id=auth.uid()),candidates as(select q.id,q.topic_id,t.title topic,q.prompt,q.options,q.answer,q.explanation,q.difficulty,q.skill,case q.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end points,q.question_type,q.interaction_config,q.hint,q.animation,q.time_limit_seconds,q.media_url,coalesce(tm.mastery,0) mastery,coalesce(a.attempts,0) attempts,coalesce(r.recent_rank,999999) recent_rank from public.learning_questions q join public.learning_topics t on t.id=q.topic_id left join topic_mastery tm on tm.topic_id=q.topic_id left join attempted a on a.question_id=q.id left join recent r on r.question_id=q.id where auth.uid() is not null and q.status='published' and (p_topic_id is null or q.topic_id=p_topic_id)),ranked as(select c.*,row_number() over(order by case when c.mastery<50 and c.difficulty='easy' then 0 when c.mastery between 50 and 69 and c.difficulty='medium' then 0 when c.mastery between 70 and 89 and c.difficulty in('medium','hard') then 0 when c.mastery>=90 and c.difficulty='hard' then 0 else 1 end,case when c.mastery<60 then c.mastery else 100-c.mastery end asc,case when c.recent_rank<=5 then 1 else 0 end asc,c.attempts asc,random()) rn from candidates c)
select id,topic_id,topic,prompt,options,answer,explanation,difficulty,skill,points,question_type,interaction_config,hint,animation,time_limit_seconds,media_url,case when mastery<50 then 'Remediation: strengthen this skill' when mastery<70 then 'Practice: build consistency' when mastery<90 then 'Progression: increase difficulty' else 'Challenge: extend mastery' end adaptive_reason from ranked where rn<=(select n from limits) order by rn;
$$;
revoke all on function public.get_adaptive_learning_path(integer,text) from public,anon;
grant execute on function public.get_adaptive_learning_path(integer,text) to authenticated;
