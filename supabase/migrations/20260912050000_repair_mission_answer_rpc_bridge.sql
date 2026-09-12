create or replace function public.submit_learning_answer(p_question_id text, p_selected_answer text)
returns table(is_correct boolean, correct_answer text, explanation text, xp_awarded integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_result
  from public.submit_daily_mission_answer(p_question_id, p_selected_answer);

  return query
  select v_result.is_correct,
         v_result.correct_answer,
         v_result.explanation,
         v_result.xp_awarded;
exception
  when others then
    raise exception 'Mission answer submission failed: %', sqlerrm;
end;
$$;

grant execute on function public.submit_learning_answer(text,text) to authenticated;

notify pgrst, 'reload schema';
