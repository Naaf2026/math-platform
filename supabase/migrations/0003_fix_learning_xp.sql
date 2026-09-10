-- Phase 3 fix: make XP awarding safe for UUID attempt IDs.

create or replace function public.submit_learning_answer(p_question_id text, p_selected_answer text)
returns table(is_correct boolean, correct_answer text, explanation text, xp_awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_question public.learning_questions%rowtype;
  v_correct boolean;
  v_xp integer := 0;
  v_attempt_id uuid;
  v_topic_count integer;
  v_correct_count integer;
  v_topic_id text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_question from public.learning_questions where id = p_question_id;
  if not found then raise exception 'Question not found'; end if;

  v_correct := p_selected_answer = v_question.answer;

  insert into public.question_attempts(user_id, question_id, selected_answer, is_correct, xp_awarded)
  values (v_user_id, p_question_id, p_selected_answer, v_correct, 0)
  returning id into v_attempt_id;

  if v_correct and not exists (
    select 1 from public.question_attempts
    where user_id = v_user_id and question_id = p_question_id and is_correct and id <> v_attempt_id
  ) then
    v_xp := 10;
    update public.question_attempts set xp_awarded = 10 where id = v_attempt_id;
    update public.profiles set xp = coalesce(xp, 0) + 10 where id = v_user_id;
  end if;

  v_topic_id := v_question.topic_id;
  insert into public.topic_progress(user_id, topic_id, questions_answered, correct_answers, updated_at)
  values (v_user_id, v_topic_id, 1, case when v_correct then 1 else 0 end, now())
  on conflict (user_id, topic_id) do update set
    questions_answered = public.topic_progress.questions_answered + 1,
    correct_answers = public.topic_progress.correct_answers + case when v_correct then 1 else 0 end,
    updated_at = now();

  select count(distinct qa.question_id), count(distinct qa.question_id) filter (where qa.is_correct)
    into v_topic_count, v_correct_count
    from public.question_attempts qa
    join public.learning_questions q on q.id = qa.question_id
   where qa.user_id = v_user_id and q.topic_id = v_topic_id;

  if v_topic_count >= (select count(*) from public.learning_questions where topic_id = v_topic_id)
     and v_correct_count >= (select count(*) from public.learning_questions where topic_id = v_topic_id) then
    update public.topic_progress
       set completed_at = coalesce(completed_at, now()), updated_at = now()
     where user_id = v_user_id and topic_id = v_topic_id;
  end if;

  return query select v_correct, v_question.answer, v_question.explanation, v_xp;
end;
$$;

revoke all on function public.submit_learning_answer(text, text) from public, anon;
grant execute on function public.submit_learning_answer(text, text) to authenticated;
