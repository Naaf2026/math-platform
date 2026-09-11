-- Phase 6: AI Curriculum Question Builder
-- Adds curriculum/book context, AI generation jobs, staged questions and validation.
-- AI-generated questions remain staged until validated/approved.

create table if not exists public.curriculums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  provider text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid references public.curriculums(id) on delete set null,
  title text not null,
  subject text not null,
  grade integer not null check (grade between 1 and 13),
  min_age integer,
  max_age integer,
  academic_year integer,
  publisher text,
  isbn text,
  description text,
  file_path text,
  file_name text,
  file_size bigint,
  processing_status text not null default 'pending' check (processing_status in ('pending','processing','indexed','failed')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_age is null or min_age between 3 and 25),
  check (max_age is null or max_age between 3 and 25),
  check (min_age is null or max_age is null or min_age <= max_age)
);

create table if not exists public.book_chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  chapter_number integer,
  title text not null,
  description text,
  page_start integer,
  page_end integer,
  content text,
  created_at timestamptz not null default now()
);

create table if not exists public.book_sections (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.book_chapters(id) on delete cascade,
  title text,
  page_start integer,
  page_end integer,
  content text not null,
  section_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_objectives (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books(id) on delete cascade,
  chapter_id uuid references public.book_chapters(id) on delete cascade,
  subject text not null,
  grade integer not null check (grade between 1 and 13),
  title text not null,
  description text,
  skill_code text,
  cognitive_level text check (cognitive_level in ('remember','understand','apply','analyse','evaluate','create')),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references auth.users(id) on delete set null,
  book_id uuid references public.books(id) on delete set null,
  chapter_id uuid references public.book_chapters(id) on delete set null,
  learning_objective_id uuid references public.learning_objectives(id) on delete set null,
  grade integer not null check (grade between 1 and 13),
  age integer check (age is null or age between 3 and 25),
  subject text not null,
  difficulty text not null default 'adaptive' check (difficulty in ('easy','medium','hard','adaptive')),
  question_types jsonb not null default '[]'::jsonb check (jsonb_typeof(question_types) = 'array'),
  requested_count integer not null check (requested_count between 1 and 100),
  generated_count integer not null default 0,
  approved_count integer not null default 0,
  rejected_count integer not null default 0,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  model text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ai_generated_questions (
  id uuid primary key default gen_random_uuid(),
  generation_job_id uuid not null references public.ai_generation_jobs(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  chapter_id uuid references public.book_chapters(id) on delete set null,
  learning_objective_id uuid references public.learning_objectives(id) on delete set null,
  grade integer not null check (grade between 1 and 13),
  age_min integer,
  age_max integer,
  subject text not null,
  topic text,
  skill text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  question_type text not null,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null,
  explanation text,
  hint text,
  interaction_config jsonb not null default '{}'::jsonb,
  source_reference jsonb not null default '{}'::jsonb,
  ai_confidence numeric check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)),
  validation_status text not null default 'pending' check (validation_status in ('pending','approved','rejected','needs_review')),
  validation_errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null
);

create table if not exists public.question_validation_results (
  id uuid primary key default gen_random_uuid(),
  generated_question_id uuid not null references public.ai_generated_questions(id) on delete cascade,
  mathematically_correct boolean,
  answer_valid boolean,
  grade_appropriate boolean,
  age_appropriate boolean,
  curriculum_aligned boolean,
  difficulty_valid boolean,
  duplicate_detected boolean,
  quality_score numeric check (quality_score is null or (quality_score >= 0 and quality_score <= 100)),
  validator_notes text,
  validated_by text,
  created_at timestamptz not null default now()
);

create index if not exists books_grade_subject_idx on public.books(grade, subject) where is_active = true;
create index if not exists book_chapters_book_idx on public.book_chapters(book_id, chapter_number);
create index if not exists book_sections_chapter_idx on public.book_sections(chapter_id, section_order);
create index if not exists learning_objectives_book_chapter_idx on public.learning_objectives(book_id, chapter_id, grade);
create index if not exists ai_jobs_status_idx on public.ai_generation_jobs(status, created_at desc);
create index if not exists ai_questions_job_idx on public.ai_generated_questions(generation_job_id);
create index if not exists ai_questions_status_idx on public.ai_generated_questions(validation_status, grade, subject);
create index if not exists ai_validation_question_idx on public.question_validation_results(generated_question_id, created_at desc);

alter table public.curriculums enable row level security;
alter table public.books enable row level security;
alter table public.book_chapters enable row level security;
alter table public.book_sections enable row level security;
alter table public.learning_objectives enable row level security;
alter table public.ai_generation_jobs enable row level security;
alter table public.ai_generated_questions enable row level security;
alter table public.question_validation_results enable row level security;

-- Students/teachers can read the curriculum catalogue. Writes are performed by trusted server/Edge Function code.
drop policy if exists "Authenticated users can read curriculums" on public.curriculums;
create policy "Authenticated users can read curriculums" on public.curriculums for select to authenticated using (active = true);

drop policy if exists "Authenticated users can read active books" on public.books;
create policy "Authenticated users can read active books" on public.books for select to authenticated using (is_active = true);

drop policy if exists "Authenticated users can read book chapters" on public.book_chapters;
create policy "Authenticated users can read book chapters" on public.book_chapters for select to authenticated using (exists (select 1 from public.books b where b.id = book_id and b.is_active));

drop policy if exists "Authenticated users can read book sections" on public.book_sections;
create policy "Authenticated users can read book sections" on public.book_sections for select to authenticated using (exists (select 1 from public.book_chapters c join public.books b on b.id = c.book_id where c.id = chapter_id and b.is_active));

drop policy if exists "Authenticated users can read learning objectives" on public.learning_objectives;
create policy "Authenticated users can read learning objectives" on public.learning_objectives for select to authenticated using (true);

drop policy if exists "Users can read their AI jobs" on public.ai_generation_jobs;
create policy "Users can read their AI jobs" on public.ai_generation_jobs for select to authenticated using (requested_by = (select auth.uid()));

drop policy if exists "Users can read staged AI questions from their jobs" on public.ai_generated_questions;
create policy "Users can read staged AI questions from their jobs" on public.ai_generated_questions for select to authenticated using (exists (select 1 from public.ai_generation_jobs j where j.id = generation_job_id and j.requested_by = (select auth.uid())));

drop policy if exists "Users can read validation results from their jobs" on public.question_validation_results;
create policy "Users can read validation results from their jobs" on public.question_validation_results for select to authenticated using (exists (select 1 from public.ai_generated_questions q join public.ai_generation_jobs j on j.id = q.generation_job_id where q.id = generated_question_id and j.requested_by = (select auth.uid())));

-- Service-role/server code owns inserts/updates/deletes; never expose the service role key to the browser.
revoke all on table public.curriculums, public.books, public.book_chapters, public.book_sections,
  public.learning_objectives, public.ai_generation_jobs, public.ai_generated_questions,
  public.question_validation_results from anon;

grant select on public.curriculums, public.books, public.book_chapters, public.book_sections, public.learning_objectives to authenticated;
grant select on public.ai_generation_jobs, public.ai_generated_questions, public.question_validation_results to authenticated;

-- Reusable updated_at trigger.
drop trigger if exists curriculums_updated_at on public.curriculums;
create trigger curriculums_updated_at before update on public.curriculums for each row execute procedure public.set_updated_at();
drop trigger if exists books_updated_at on public.books;
create trigger books_updated_at before update on public.books for each row execute procedure public.set_updated_at();

-- Safely stage an approved AI question into the existing learning question bank.
create or replace function public.publish_ai_question(p_generated_question_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.ai_generated_questions%rowtype;
  new_id text;
  topic_id_value text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into q from public.ai_generated_questions where id = p_generated_question_id;
  if not found then raise exception 'Generated question not found'; end if;
  if q.validation_status <> 'approved' then raise exception 'Question must be approved before publishing'; end if;

  topic_id_value := lower(regexp_replace(coalesce(q.topic, q.skill, 'ai-generated'), '[^a-zA-Z0-9]+', '-', 'g'));
  topic_id_value := trim(both '-' from topic_id_value);
  if topic_id_value = '' then topic_id_value := 'ai-generated'; end if;

  insert into public.learning_topics(id, title, description, level, lessons, sort_order)
  values (topic_id_value, coalesce(q.topic, q.skill, 'AI Generated'), 'Curriculum-aligned AI generated learning topic.', case when q.grade <= 4 then 'Foundation' else 'Development' end, 1, 999)
  on conflict (id) do nothing;

  new_id := 'ai-' || replace(q.id::text, '-', '');
  insert into public.learning_questions(
    id, topic_id, prompt, options, answer, explanation, sort_order,
    difficulty, skill, question_type, interaction_config, hint, animation, media_url
  ) values (
    new_id, topic_id_value, q.prompt, q.options, q.correct_answer->>'value', coalesce(q.explanation, ''),
    extract(epoch from clock_timestamp())::integer, q.difficulty, coalesce(q.skill, 'curriculum'),
    q.question_type, q.interaction_config, q.hint, 'question-enter', null
  ) on conflict (id) do nothing;

  update public.ai_generated_questions
     set approved_at = coalesce(approved_at, now()), approved_by = auth.uid()
   where id = q.id;
  return new_id;
end;
$$;

revoke all on function public.publish_ai_question(uuid) from public, anon;
grant execute on function public.publish_ai_question(uuid) to authenticated;
