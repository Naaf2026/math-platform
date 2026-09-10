-- Phase 3: persistent learning content, attempts, topic progress and XP.

create table if not exists public.learning_topics (
  id text primary key,
  title text not null,
  description text not null,
  level text not null,
  lessons integer not null default 1,
  sort_order integer not null default 0
);

create table if not exists public.learning_questions (
  id text primary key,
  topic_id text not null references public.learning_topics(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  answer text not null,
  explanation text not null,
  sort_order integer not null default 0
);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.learning_questions(id) on delete cascade,
  selected_answer text not null,
  is_correct boolean not null,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.learning_topics(id) on delete cascade,
  questions_answered integer not null default 0,
  correct_answers integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.learning_topics enable row level security;
alter table public.learning_questions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.topic_progress enable row level security;

revoke all on table public.learning_topics, public.learning_questions, public.question_attempts, public.topic_progress from anon;
grant select on table public.learning_topics, public.learning_questions to authenticated;
grant select on table public.question_attempts, public.topic_progress to authenticated;

drop policy if exists "Authenticated users can read learning topics" on public.learning_topics;
create policy "Authenticated users can read learning topics" on public.learning_topics
  for select to authenticated using (true);

drop policy if exists "Authenticated users can read learning questions" on public.learning_questions;
create policy "Authenticated users can read learning questions" on public.learning_questions
  for select to authenticated using (true);

drop policy if exists "Users can read their own attempts" on public.question_attempts;
create policy "Users can read their own attempts" on public.question_attempts
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own topic progress" on public.topic_progress;
create policy "Users can read their own topic progress" on public.topic_progress
  for select to authenticated using ((select auth.uid()) = user_id);

insert into public.learning_topics (id, title, description, level, lessons, sort_order) values
('place-value', 'Place Value', 'Read, write and compare numbers with confidence.', 'Foundation', 4, 1),
('addition-subtraction', 'Addition & Subtraction', 'Build accuracy with mental and written strategies.', 'Foundation', 5, 2),
('multiplication', 'Multiplication', 'Develop fluency with facts, patterns and strategies.', 'Development', 6, 3),
('fractions', 'Fractions', 'Understand parts, equivalence and simple operations.', 'Development', 6, 4)
on conflict (id) do update set title = excluded.title, description = excluded.description, level = excluded.level, lessons = excluded.lessons, sort_order = excluded.sort_order;

insert into public.learning_questions (id, topic_id, prompt, options, answer, explanation, sort_order) values
('pv-1', 'place-value', 'What is the value of the 7 in 3,742?', '["7","70","700","7,000"]', '700', 'The 7 is in the hundreds place, so its value is 700.', 1),
('pv-2', 'place-value', 'Which number is greatest?', '["2,405","2,450","2,045","2,405"]', '2,450', 'Compare the hundreds and tens: 2,450 is the greatest.', 2),
('as-1', 'addition-subtraction', 'What is 48 + 27?', '["65","75","85","95"]', '75', '48 + 20 = 68, then 68 + 7 = 75.', 1),
('as-2', 'addition-subtraction', 'What is 93 − 38?', '["45","55","65","75"]', '55', '93 − 30 = 63, then 63 − 8 = 55.', 2),
('mul-1', 'multiplication', 'What is 6 × 7?', '["36","42","48","54"]', '42', 'Six groups of seven make 42.', 1),
('mul-2', 'multiplication', 'What is 8 × 5?', '["35","40","45","50"]', '40', 'Eight groups of five make 40.', 2),
('fr-1', 'fractions', 'Which fraction is equivalent to 1/2?', '["1/3","2/4","3/5","4/10"]', '2/4', 'Multiplying the numerator and denominator of 1/2 by 2 gives 2/4.', 1),
('fr-2', 'fractions', 'Which fraction is greater?', '["1/4","1/2","1/8","1/10"]', '1/2', 'With the same numerator, the fraction with the smaller denominator is greater.', 2)
on conflict (id) do update set topic_id = excluded.topic_id, prompt = excluded.prompt, options = excluded.options, answer = excluded.answer, explanation = excluded.explanation, sort_order = excluded.sort_order;

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
  v_topic_count integer;
  v_correct_count integer;
  v_topic_id text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_question from public.learning_questions where id = p_question_id;
  if not found then raise exception 'Question not found'; end if;

  v_correct := p_selected_answer = v_question.answer;

  insert into public.question_attempts(user_id, question_id, selected_answer, is_correct, xp_awarded)
  values (v_user_id, p_question_id, p_selected_answer, v_correct, 0);

  if v_correct and not exists (
    select 1 from public.question_attempts
    where user_id = v_user_id and question_id = p_question_id and is_correct and id <> currval(pg_get_serial_sequence('question_attempts','id'))
  ) then
    v_xp := 10;
    update public.question_attempts set xp_awarded = 10 where id = (
      select id from public.question_attempts where user_id = v_user_id and question_id = p_question_id order by created_at desc, id desc limit 1
    );
    update public.profiles set xp = coalesce(xp, 0) + 10 where id = v_user_id;
  end if;

  v_topic_id := v_question.topic_id;
  insert into public.topic_progress(user_id, topic_id, questions_answered, correct_answers, updated_at)
  values (v_user_id, v_topic_id, 1, case when v_correct then 1 else 0 end, now())
  on conflict (user_id, topic_id) do update set
    questions_answered = public.topic_progress.questions_answered + 1,
    correct_answers = public.topic_progress.correct_answers + case when v_correct then 1 else 0 end,
    updated_at = now();

  select count(distinct question_id), count(distinct question_id) filter (where is_correct)
    into v_topic_count, v_correct_count
    from public.question_attempts qa
    join public.learning_questions q on q.id = qa.question_id
   where qa.user_id = v_user_id and q.topic_id = v_topic_id;

  if v_topic_count >= (select count(*) from public.learning_questions where topic_id = v_topic_id)
     and v_correct_count >= (select count(*) from public.learning_questions where topic_id = v_topic_id) then
    update public.topic_progress set completed_at = coalesce(completed_at, now()), updated_at = now()
     where user_id = v_user_id and topic_id = v_topic_id;
  end if;

  return query select v_correct, v_question.answer, v_question.explanation, v_xp;
end;
$$;

revoke all on function public.submit_learning_answer(text, text) from public, anon;
grant execute on function public.submit_learning_answer(text, text) to authenticated;
