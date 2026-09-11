-- Fix the lesson completion RPC so production databases that already have the
-- Phase 3B boolean version can safely move to the XP-returning integer version.

drop function if exists public.complete_learning_lesson(text);

create function public.complete_learning_lesson(p_lesson_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_topic_id text;
  v_first_completion boolean := false;
  v_xp integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select topic_id into v_topic_id
    from public.learning_lessons
   where id = p_lesson_id;

  if v_topic_id is null then
    raise exception 'Lesson not found';
  end if;

  if not exists (
    select 1
      from public.lesson_progress
     where user_id = v_user_id
       and lesson_id = p_lesson_id
       and completed_at is not null
  ) then
    v_first_completion := true;
  end if;

  insert into public.lesson_progress(user_id, lesson_id, completed_at, updated_at)
  values (v_user_id, p_lesson_id, now(), now())
  on conflict (user_id, lesson_id) do update
    set completed_at = coalesce(public.lesson_progress.completed_at, now()),
        updated_at = now();

  if v_first_completion then
    v_xp := 5;
    update public.profiles
       set xp = coalesce(xp, 0) + 5,
           updated_at = now()
     where id = v_user_id;
  end if;

  perform public.record_learning_activity();
  perform public.refresh_learning_achievements();

  return v_xp;
end;
$$;

revoke all on function public.complete_learning_lesson(text) from public, anon;
grant execute on function public.complete_learning_lesson(text) to authenticated;
