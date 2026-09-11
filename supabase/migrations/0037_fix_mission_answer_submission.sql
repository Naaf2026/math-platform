-- 0037: make Mission answer submission resilient.
-- The answer attempt is the critical write. Progress/activity/achievement
-- bookkeeping must not make a submitted answer appear to fail.

drop function if exists public.submit_learning_answer(text, text);

create function public.submit_learning_answer(
  p_question_id text,
  p_selected_answer text
)
returns table(
  is_correct boolean,
  correct_answer text,
  explanation text,
  xp_awarded integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_question public.learning_questions%rowtype;
  v_correct boolean;
  v_xp integer := 0;
  v_attempt_id uuid;
  v_topic_id text;
  v_answered integer;
  v_correct_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into v_question
    from public.learning_questions
   where id = p_question_id;

  if not found then
    raise exception 'Question not found';
  end if;

  -- Critical write: this is the authoritative answer record.
  insert into public.question_attempts(
    user_id,
    question_id,
    selected_answer,
    is_correct,
    xp_awarded
  )
  values(
    v_user_id,
    p_question_id,
    p_selected_answer,
    p_selected_answer = v_question.answer,
    0
  )
  returning id into v_attempt_id;

  v_correct := p_selected_answer = v_question.answer;

  if v_correct then
    v_xp := case v_question.difficulty
      when 'easy' then 10
      when 'medium' then 15
      else 20
    end;

    update public.question_attempts
       set xp_awarded = v_xp
     where id = v_attempt_id;

    update public.profiles
       set xp = coalesce(xp, 0) + v_xp,
           updated_at = now()
     where id = v_user_id;
  end if;

  -- Progress is valuable but non-critical. If a legacy/partially migrated
  -- progress schema causes an error, keep the answer saved and return it.
  begin
    v_topic_id := v_question.topic_id;

    insert into public.topic_progress(
      user_id,
      topic_id,
      questions_answered,
      correct_answers,
      updated_at
    )
    values(
      v_user_id,
      v_topic_id,
      1,
      case when v_correct then 1 else 0 end,
      now()
    )
    on conflict(user_id, topic_id) do update set
      questions_answered = public.topic_progress.questions_answered + 1,
      correct_answers = public.topic_progress.correct_answers + case when v_correct then 1 else 0 end,
      updated_at = now();

    select questions_answered, correct_answers
      into v_answered, v_correct_count
      from public.topic_progress
     where user_id = v_user_id
       and topic_id = v_topic_id;

    update public.topic_progress
       set mastery = least(
         100,
         round((v_correct_count::numeric / greatest(v_answered, 1)) * 100)::integer
       )
     where user_id = v_user_id
       and topic_id = v_topic_id;
  exception when others then
    null;
  end;

  -- Secondary gamification bookkeeping must never roll back the answer.
  begin
    perform public.record_learning_activity();
  exception when others then
    null;
  end;

  begin
    perform public.refresh_learning_achievements();
  exception when others then
    null;
  end;

  return query
  select
    v_correct,
    v_question.answer,
    v_question.explanation,
    v_xp;
end;
$$;

revoke all on function public.submit_learning_answer(text, text) from public, anon;
grant execute on function public.submit_learning_answer(text, text) to authenticated;

notify pgrst, 'reload schema';
