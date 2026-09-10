-- Phase 3B: lesson structure and persistent lesson completion.

create table if not exists public.learning_lessons (
  id text primary key,
  topic_id text not null references public.learning_topics(id) on delete cascade,
  title text not null,
  objective text not null,
  lesson_number integer not null,
  sort_order integer not null default 0
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.learning_lessons(id) on delete cascade,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.learning_lessons enable row level security;
alter table public.lesson_progress enable row level security;

revoke all on table public.learning_lessons, public.lesson_progress from anon;
grant select on table public.learning_lessons to authenticated;
grant select on table public.lesson_progress to authenticated;

drop policy if exists "Authenticated users can read learning lessons" on public.learning_lessons;
create policy "Authenticated users can read learning lessons" on public.learning_lessons
  for select to authenticated using (true);

drop policy if exists "Users can read their own lesson progress" on public.lesson_progress;
create policy "Users can read their own lesson progress" on public.lesson_progress
  for select to authenticated using ((select auth.uid()) = user_id);

insert into public.learning_lessons (id, topic_id, title, objective, lesson_number, sort_order) values
('pv-l1','place-value','Understanding Place Value','Identify the value and position of digits in whole numbers.',1,1),
('pv-l2','place-value','Reading Large Numbers','Read, write and compare numbers using place-value knowledge.',2,2),
('pv-l3','place-value','Expanded Form','Represent numbers using expanded notation.',3,3),
('pv-l4','place-value','Place Value Challenge','Apply place-value strategies to mixed questions.',4,4),
('as-l1','addition-subtraction','Addition Strategies','Use efficient mental and written addition strategies.',1,1),
('as-l2','addition-subtraction','Subtraction Strategies','Subtract accurately using flexible methods.',2,2),
('as-l3','addition-subtraction','Regrouping','Understand regrouping across place values.',3,3),
('as-l4','addition-subtraction','Checking Answers','Use estimation and inverse operations to check work.',4,4),
('as-l5','addition-subtraction','Arithmetic Challenge','Apply addition and subtraction to mixed problems.',5,5),
('mul-l1','multiplication','Multiplication Foundations','Understand multiplication as equal groups and repeated addition.',1,1),
('mul-l2','multiplication','Multiplication Facts','Build fluency with core multiplication facts.',2,2),
('mul-l3','multiplication','Patterns & Strategies','Use patterns and known facts to solve harder products.',3,3),
('mul-l4','multiplication','Mental Multiplication','Develop efficient mental multiplication strategies.',4,4),
('mul-l5','multiplication','Word Problems','Choose multiplication strategies for real situations.',5,5),
('mul-l6','multiplication','Multiplication Challenge','Apply multiplication skills in mixed practice.',6,6),
('fr-l1','fractions','Fraction Foundations','Understand fractions as equal parts of a whole.',1,1),
('fr-l2','fractions','Equivalent Fractions','Recognise and create equivalent fractions.',2,2),
('fr-l3','fractions','Comparing Fractions','Compare simple fractions using models and reasoning.',3,3),
('fr-l4','fractions','Fractions on a Number Line','Place and interpret fractions on a number line.',4,4),
('fr-l5','fractions','Fraction Strategies','Use visual and numerical strategies with fractions.',5,5),
('fr-l6','fractions','Fractions Challenge','Apply fraction concepts in mixed practice.',6,6)
on conflict (id) do update set title=excluded.title, objective=excluded.objective, lesson_number=excluded.lesson_number, sort_order=excluded.sort_order;

insert into public.lesson_progress(user_id, lesson_id, completed_at, updated_at)
select tp.user_id, l.id, now(), now()
from public.topic_progress tp
join public.learning_lessons l on l.topic_id = tp.topic_id
where tp.completed_at is not null
on conflict (user_id, lesson_id) do nothing;

create or replace function public.complete_learning_lesson(p_lesson_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_topic_id text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select topic_id into v_topic_id from public.learning_lessons where id = p_lesson_id;
  if v_topic_id is null then raise exception 'Lesson not found'; end if;
  insert into public.lesson_progress(user_id, lesson_id, completed_at, updated_at)
  values (v_user_id, p_lesson_id, now(), now())
  on conflict (user_id, lesson_id) do update set completed_at=coalesce(public.lesson_progress.completed_at, now()), updated_at=now();
  return true;
end;
$$;

revoke all on function public.complete_learning_lesson(text) from public, anon;
grant execute on function public.complete_learning_lesson(text) to authenticated;
