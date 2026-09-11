-- Phase 3B: persistent learning activity, streaks, achievements and lesson XP.

alter table public.profiles
  add column if not exists current_streak integer not null default 0,
  add column if not exists best_streak integer not null default 0,
  add column if not exists last_activity_date date;

create table if not exists public.learning_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

create table if not exists public.learning_achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  sort_order integer not null default 0
);

create table if not exists public.student_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.learning_achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.learning_activity enable row level security;
alter table public.learning_achievements enable row level security;
alter table public.student_achievements enable row level security;

revoke all on table public.learning_activity, public.learning_achievements, public.student_achievements from anon;
grant select on table public.learning_activity, public.learning_achievements, public.student_achievements to authenticated;

drop policy if exists "Users can read their own learning activity" on public.learning_activity;
create policy "Users can read their own learning activity" on public.learning_activity
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can read learning achievements" on public.learning_achievements;
create policy "Authenticated users can read learning achievements" on public.learning_achievements
  for select to authenticated using (true);

drop policy if exists "Users can read their own achievements" on public.student_achievements;
create policy "Users can read their own achievements" on public.student_achievements
  for select to authenticated using ((select auth.uid()) = user_id);

insert into public.learning_achievements (id, title, description, icon, sort_order) values
('first-lesson', 'First Lesson', 'Complete your first lesson.', '🎯', 1),
('xp-100', '100 XP', 'Earn 100 XP from learning activities.', '⭐', 2),
('streak-3', '3-Day Streak', 'Learn for three days in a row.', '🔥', 3),
('topic-complete', 'Topic Complete', 'Complete all practice questions in a topic.', '🏆', 4),
('lessons-10', '10 Lessons', 'Complete ten lessons.', '🚀', 5)
on conflict (id) do update set title=excluded.title, description=excluded.description, icon=excluded.icon, sort_order=excluded.sort_order;

create or replace function public.record_learning_activity()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_last date;
  v_current integer;
  v_best integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select last_activity_date, current_streak, best_streak
    into v_last, v_current, v_best
    from public.profiles
   where id = v_user_id
   for update;

  if v_last = v_today then
    return coalesce(v_current, 1);
  elsif v_last = v_today - 1 then
    v_current := greatest(coalesce(v_current, 0) + 1, 1);
  else
    v_current := 1;
  end if;

  v_best := greatest(coalesce(v_best, 0), v_current);

  insert into public.learning_activity(user_id, activity_date)
  values (v_user_id, v_today)
  on conflict (user_id, activity_date) do nothing;

  update public.profiles
     set current_streak = v_current,
         best_streak = v_best,
         last_activity_date = v_today,
         updated_at = now()
   where id = v_user_id;

  return v_current;
end;
$$;

revoke all on function public.record_learning_activity() from public, anon;
grant execute on function public.record_learning_activity() to authenticated;

create or replace function public.refresh_learning_achievements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_xp integer := 0;
  v_streak integer := 0;
  v_lessons integer := 0;
  v_topics integer := 0;
  v_awarded integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select coalesce(xp,0), coalesce(current_streak,0)
    into v_xp, v_streak from public.profiles where id = v_user_id;
  select count(*) into v_lessons from public.lesson_progress where user_id = v_user_id and completed_at is not null;
  select count(*) into v_topics from public.topic_progress where user_id = v_user_id and completed_at is not null;

  if v_lessons >= 1 then
    insert into public.student_achievements(user_id, achievement_id) values (v_user_id,'first-lesson') on conflict do nothing;
  end if;
  if v_xp >= 100 then
    insert into public.student_achievements(user_id, achievement_id) values (v_user_id,'xp-100') on conflict do nothing;
  end if;
  if v_streak >= 3 then
    insert into public.student_achievements(user_id, achievement_id) values (v_user_id,'streak-3') on conflict do nothing;
  end if;
  if v_topics >= 1 then
    insert into public.student_achievements(user_id, achievement_id) values (v_user_id,'topic-complete') on conflict do nothing;
  end if;
  if v_lessons >= 10 then
    insert into public.student_achievements(user_id, achievement_id) values (v_user_id,'lessons-10') on conflict do nothing;
  end if;

  select count(*) into v_awarded from public.student_achievements where user_id = v_user_id;
  return v_awarded;
end;
$$;

revoke all on function public.refresh_learning_achievements() from public, anon;
grant execute on function public.refresh_learning_achievements() to authenticated;

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
  select topic_id into v_topic_id from public.learning_lessons where id = p_lesson_id;
  if v_topic_id is null then raise exception 'Lesson not found'; end if;

  if not exists (
    select 1 from public.lesson_progress
     where user_id = v_user_id and lesson_id = p_lesson_id and completed_at is not null
  ) then
    v_first_completion := true;
  end if;

  insert into public.lesson_progress(user_id, lesson_id, completed_at, updated_at)
  values (v_user_id, p_lesson_id, now(), now())
  on conflict (user_id, lesson_id) do update
    set completed_at=coalesce(public.lesson_progress.completed_at, now()), updated_at=now();

  if v_first_completion then
    v_xp := 5;
    update public.profiles set xp = coalesce(xp,0) + 5, updated_at=now() where id=v_user_id;
  end if;

  perform public.record_learning_activity();
  perform public.refresh_learning_achievements();
  return v_xp;
end;
$$;

revoke all on function public.complete_learning_lesson(text) from public, anon;
grant execute on function public.complete_learning_lesson(text) to authenticated;

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
    update public.question_attempts set xp_awarded=10 where id=v_attempt_id;
    update public.profiles set xp=coalesce(xp,0)+10, updated_at=now() where id=v_user_id;
  end if;

  v_topic_id := v_question.topic_id;
  insert into public.topic_progress(user_id, topic_id, questions_answered, correct_answers, updated_at)
  values (v_user_id, v_topic_id, 1, case when v_correct then 1 else 0 end, now())
  on conflict (user_id, topic_id) do update set
    questions_answered=public.topic_progress.questions_answered+1,
    correct_answers=public.topic_progress.correct_answers+case when v_correct then 1 else 0 end,
    updated_at=now();

  select count(distinct qa.question_id), count(distinct qa.question_id) filter (where qa.is_correct)
    into v_topic_count, v_correct_count
    from public.question_attempts qa
    join public.learning_questions q on q.id=qa.question_id
   where qa.user_id=v_user_id and q.topic_id=v_topic_id;

  if v_topic_count >= (select count(*) from public.learning_questions where topic_id=v_topic_id)
     and v_correct_count >= (select count(*) from public.learning_questions where topic_id=v_topic_id) then
    update public.topic_progress set completed_at=coalesce(completed_at,now()),updated_at=now()
     where user_id=v_user_id and topic_id=v_topic_id;
  end if;

  perform public.record_learning_activity();
  perform public.refresh_learning_achievements();
  return query select v_correct,v_question.answer,v_question.explanation,v_xp;
end;
$$;

revoke all on function public.submit_learning_answer(text,text) from public, anon;
grant execute on function public.submit_learning_answer(text,text) to authenticated;
