-- Reusable textbook question templates.
-- The template stores the exercise structure; generated instances supply new values.
-- This keeps mathematics/illustrations deterministic in the application.

create table if not exists public.question_templates (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books(id) on delete set null,
  chapter_id uuid references public.book_chapters(id) on delete set null,
  source_page_start integer,
  source_page_end integer,
  template_name text not null,
  question_type text not null,
  template_text text not null,
  variables jsonb not null default '{}'::jsonb,
  answer_rules jsonb not null default '{}'::jsonb,
  illustration_config jsonb not null default '{}'::jsonb,
  interaction_config jsonb not null default '{}'::jsonb,
  example_values jsonb not null default '{}'::jsonb,
  source_excerpt text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_templates_type_check check (question_type in (
    'multiple_choice','number_input','text_input','true_false','ordering',
    'drag_drop','number_line','manipulatives','geometry','timed_challenge',
    'visual_question','visual_table'
  ))
);

create index if not exists question_templates_book_page_idx
  on public.question_templates(book_id, source_page_start, source_page_end);
create index if not exists question_templates_chapter_idx
  on public.question_templates(chapter_id);
create index if not exists question_templates_type_active_idx
  on public.question_templates(question_type, active);

alter table public.question_templates enable row level security;

drop policy if exists question_templates_authenticated_read on public.question_templates;
create policy question_templates_authenticated_read
  on public.question_templates for select
  to authenticated
  using (active = true);

drop policy if exists question_templates_staff_write on public.question_templates;
create policy question_templates_staff_write
  on public.question_templates for all
  to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('admin','teacher')
  ))
  with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('admin','teacher')
  ));

alter table public.learning_questions
  add column if not exists template_id uuid references public.question_templates(id) on delete set null;

create index if not exists learning_questions_template_idx
  on public.learning_questions(template_id);

create table if not exists public.question_template_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.question_templates(id) on delete cascade,
  learning_question_id text references public.learning_questions(id) on delete cascade,
  values jsonb not null default '{}'::jsonb,
  generated_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique(template_id, generated_on, id)
);

create index if not exists question_template_instances_day_idx
  on public.question_template_instances(generated_on, template_id);

alter table public.question_template_instances enable row level security;

drop policy if exists question_template_instances_authenticated_read on public.question_template_instances;
create policy question_template_instances_authenticated_read
  on public.question_template_instances for select
  to authenticated
  using (true);

drop policy if exists question_template_instances_staff_write on public.question_template_instances;
create policy question_template_instances_staff_write
  on public.question_template_instances for all
  to authenticated
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('admin','teacher')
  ))
  with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('admin','teacher')
  ));
