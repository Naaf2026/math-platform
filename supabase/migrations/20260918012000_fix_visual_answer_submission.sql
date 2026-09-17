-- Make visual_question / visual_table answers first-class in the existing
-- answer submission RPC so attempts, XP, mastery and history all agree with
-- the Daily Challenge renderer.

drop function if exists public.submit_learning_answer(text,text);

create function public.submit_learning_answer(p_question_id text, p_selected_answer text)
returns table(is_correct boolean, correct_answer text, explanation text, xp_awarded integer)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid:=auth.uid();
  v_question public.learning_questions%rowtype;
  v_correct boolean;
  v_xp integer:=0;
  v_attempt_id uuid;
  v_topic_id text;
  v_answered integer;
  v_correct_count integer;
  v_mastery integer;
  v_visual jsonb;
  v_canonical jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_question from public.learning_questions where id=p_question_id;
  if not found then raise exception 'Question not found'; end if;

  if v_question.question_type in ('visual_question','visual_table') then
    v_visual:=coalesce(v_question.interaction_config->'visual',v_question.interaction_config);
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',r->>'id',
      'hundreds',coalesce((r->>'hundreds')::integer,0),
      'tens',coalesce((r->>'tens')::integer,0),
      'ones',coalesce((r->>'ones')::integer,0),
      'numberFormed',coalesce((r->>'numberFormed')::integer,
        coalesce((r->>'hundreds')::integer,0)*100+
        coalesce((r->>'tens')::integer,0)*10+
        coalesce((r->>'ones')::integer,0))
    ) order by ord), '[]'::jsonb)
      into v_canonical
      from jsonb_array_elements(coalesce(v_visual->'rows','[]'::jsonb)) with ordinality as x(r,ord);
    begin
      v_correct:=p_selected_answer::jsonb=v_canonical;
    exception when others then
      v_correct:=false;
    end;
  else
    v_correct:=p_selected_answer=v_question.answer;
  end if;

  insert into public.question_attempts(user_id,question_id,selected_answer,is_correct,xp_awarded)
  values(v_user_id,p_question_id,p_selected_answer,v_correct,0)
  returning id into v_attempt_id;

  if v_correct then
    v_xp:=case v_question.difficulty when 'easy' then 10 when 'medium' then 15 else 20 end;
    update public.question_attempts set xp_awarded=v_xp where id=v_attempt_id;
    update public.profiles set xp=coalesce(xp,0)+v_xp,updated_at=now() where id=v_user_id;
  end if;

  v_topic_id:=v_question.topic_id;
  insert into public.topic_progress(user_id,topic_id,questions_answered,correct_answers,updated_at)
  values(v_user_id,v_topic_id,1,case when v_correct then 1 else 0 end,now())
  on conflict(user_id,topic_id) do update set
    questions_answered=public.topic_progress.questions_answered+1,
    correct_answers=public.topic_progress.correct_answers+case when v_correct then 1 else 0 end,
    updated_at=now();

  select questions_answered,correct_answers into v_answered,v_correct_count
    from public.topic_progress where user_id=v_user_id and topic_id=v_topic_id;
  v_mastery:=least(100,round((v_correct_count::numeric/greatest(v_answered,1))*100)::integer);
  update public.topic_progress set mastery=v_mastery where user_id=v_user_id and topic_id=v_topic_id;
  perform public.record_learning_activity();
  perform public.refresh_learning_achievements();

  return query select v_correct,v_question.answer,v_question.explanation,v_xp;
end;
$$;

revoke all on function public.submit_learning_answer(text,text) from public,anon;
grant execute on function public.submit_learning_answer(text,text) to authenticated;
