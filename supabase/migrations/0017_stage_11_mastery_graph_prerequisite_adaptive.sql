-- Stage 11: Mastery Graph & Prerequisite-Aware Adaptive Engine
-- Applied to Supabase as stage_11_mastery_graph_prerequisite_adaptive_v2.

create index if not exists idx_learning_prerequisites_prerequisite on public.learning_prerequisites(prerequisite_topic_id);
create index if not exists idx_topic_progress_user_topic on public.topic_progress(user_id, topic_id);
create index if not exists idx_question_attempts_user_created on public.question_attempts(user_id, created_at desc);

create or replace function public.get_mastery_graph()
returns table(topic_id text, topic text, level text, mastery integer, mastery_band text, prerequisite_topic_id text, prerequisite_topic text, prerequisite_mastery integer, prerequisite_band text, blocked boolean, gap integer, recommendation text)
language sql stable security invoker set search_path = '' as $$
  with recursive graph as (
    select p.topic_id,p.prerequisite_topic_id,p.strength,1 depth from public.learning_prerequisites p
    union all
    select g.topic_id,p.prerequisite_topic_id,least(g.strength,p.strength),g.depth+1
    from graph g join public.learning_prerequisites p on p.topic_id=g.prerequisite_topic_id
    where g.depth<8 and p.prerequisite_topic_id<>g.topic_id
  ), mastery as (
    select t.id,greatest(0,least(100,coalesce(tp.mastery,0)))::integer mastery
    from public.learning_topics t left join public.topic_progress tp on tp.topic_id=t.id and tp.user_id=(select auth.uid())
  ), direct as (
    select distinct on (g.topic_id,g.prerequisite_topic_id) g.topic_id,g.prerequisite_topic_id,tm.mastery topic_mastery,pm.mastery prereq_mastery
    from graph g join mastery tm on tm.id=g.topic_id join mastery pm on pm.id=g.prerequisite_topic_id
    order by g.topic_id,g.prerequisite_topic_id,g.depth
  )
  select d.topic_id,t.title,t.level,d.topic_mastery,
    case when d.topic_mastery<50 then 'emerging' when d.topic_mastery<80 then 'developing' else 'mastered' end,
    d.prerequisite_topic_id,pt.title,d.prereq_mastery,
    case when d.prereq_mastery<50 then 'emerging' when d.prereq_mastery<80 then 'developing' else 'mastered' end,
    d.prereq_mastery<70,greatest(0,70-d.prereq_mastery),
    case when d.prereq_mastery<50 then 'Remediate prerequisite before advancing' when d.prereq_mastery<70 then 'Practice prerequisite for readiness' when d.topic_mastery<70 then 'Continue current topic' else 'Ready to advance' end
  from direct d join public.learning_topics t on t.id=d.topic_id join public.learning_topics pt on pt.id=d.prerequisite_topic_id
  order by d.topic_id,d.prereq_mastery asc;
$$;
revoke all on function public.get_mastery_graph() from public,anon;
grant execute on function public.get_mastery_graph() to authenticated;

drop function if exists public.get_adaptive_learning_path(integer,text);
create function public.get_adaptive_learning_path(p_limit integer default 10,p_topic_id text default null)
returns table(id text,topic_id text,topic text,prompt text,options jsonb,answer text,explanation text,difficulty text,skill text,points integer,question_type text,interaction_config jsonb,hint text,animation text,time_limit integer,media_url text,adaptive_reason text)
language sql stable security invoker set search_path = '' as $$
  with recursive prereq as (
    select p.topic_id,p.prerequisite_topic_id,1 depth from public.learning_prerequisites p
    union all select r.topic_id,p.prerequisite_topic_id,r.depth+1 from prereq r join public.learning_prerequisites p on p.topic_id=r.prerequisite_topic_id where r.depth<8 and p.prerequisite_topic_id<>r.topic_id
  ), mastery as (
    select t.id,greatest(0,least(100,coalesce(tp.mastery,0)))::integer mastery from public.learning_topics t left join public.topic_progress tp on tp.topic_id=t.id and tp.user_id=(select auth.uid())
  ), blocked as (
    select distinct r.topic_id from prereq r join mastery pm on pm.id=r.prerequisite_topic_id where pm.mastery<70
  ), candidate as (
    select q.*,m.mastery,case when b.topic_id is not null and m.mastery<70 then 1 when m.mastery<50 then 2 when m.mastery<80 then 3 when m.mastery<95 then 4 else 5 end priority,
      case when b.topic_id is not null then 'Remediation: strengthen prerequisite skills' when m.mastery<50 then 'Remediation: strengthen this skill' when m.mastery<80 then 'Practice: build consistency' when m.mastery<95 then 'Progression: increase difficulty' else 'Challenge: extend mastery' end adaptive_reason
    from public.learning_questions q join mastery m on m.id=q.topic_id left join blocked b on b.topic_id=q.topic_id
    where q.status='published' and (p_topic_id is null or q.topic_id=p_topic_id)
      and not exists(select 1 from public.question_attempts a where a.user_id=(select auth.uid()) and a.question_id=q.id and a.created_at>now()-interval '20 minutes')
  )
  select c.id,c.topic_id,t.title,c.prompt,c.options,c.answer,c.explanation,c.difficulty,c.skill,10,c.question_type,c.interaction_config,c.hint,c.animation,c.time_limit_seconds,c.media_url,c.adaptive_reason
  from candidate c join public.learning_topics t on t.id=c.topic_id
  order by c.priority,case when c.difficulty='foundation' and c.mastery<50 then 0 when c.difficulty='developing' and c.mastery between 50 and 79 then 0 when c.difficulty='proficient' and c.mastery between 70 and 94 then 0 when c.difficulty='challenge' and c.mastery>=90 then 0 else 1 end,random()
  limit greatest(1,least(coalesce(p_limit,10),20));
$$;
revoke all on function public.get_adaptive_learning_path(integer,text) from public,anon;
grant execute on function public.get_adaptive_learning_path(integer,text) to authenticated;

drop function if exists public.get_adaptive_questions(integer);
create function public.get_adaptive_questions(p_limit integer default 10)
returns table(id text,topic_id text,topic text,prompt text,options jsonb,answer text,explanation text,difficulty text,skill text,points integer,question_type text,interaction_config jsonb,hint text)
language sql stable security invoker set search_path = '' as $$ select p.id,p.topic_id,p.topic,p.prompt,p.options,p.answer,p.explanation,p.difficulty,p.skill,p.points,p.question_type,p.interaction_config,p.hint from public.get_adaptive_learning_path(greatest(1,least(coalesce(p_limit,10),20)),null) p; $$;
revoke all on function public.get_adaptive_questions(integer) from public,anon;
grant execute on function public.get_adaptive_questions(integer) to authenticated;
