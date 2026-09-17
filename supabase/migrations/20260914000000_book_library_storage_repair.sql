-- Book Library storage repair
-- Keeps the curriculum-books bucket and admin access reproducible in fresh environments.

insert into storage.buckets (id, name, public)
values ('curriculum-books', 'curriculum-books', false)
on conflict (id) do update set public = false;

drop policy if exists "Admins can read curriculum book files" on storage.objects;
create policy "Admins can read curriculum book files"
on storage.objects for select to authenticated
using (bucket_id = 'curriculum-books' and public.has_role(p_role => 'admin'));

drop policy if exists "Admins can upload curriculum book files" on storage.objects;
create policy "Admins can upload curriculum book files"
on storage.objects for insert to authenticated
with check (bucket_id = 'curriculum-books' and public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update curriculum book files" on storage.objects;
create policy "Admins can update curriculum book files"
on storage.objects for update to authenticated
using (bucket_id = 'curriculum-books' and public.has_role(p_role => 'admin'))
with check (bucket_id = 'curriculum-books' and public.has_role(p_role => 'admin'));

drop policy if exists "Admins can delete curriculum book files" on storage.objects;
create policy "Admins can delete curriculum book files"
on storage.objects for delete to authenticated
using (bucket_id = 'curriculum-books' and public.has_role(p_role => 'admin'));

-- Administrator catalogue writes.
drop policy if exists "Admins can insert curriculums" on public.curriculums;
create policy "Admins can insert curriculums" on public.curriculums for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update curriculums" on public.curriculums;
create policy "Admins can update curriculums" on public.curriculums for update to authenticated
using (public.has_role(p_role => 'admin')) with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can insert books" on public.books;
create policy "Admins can insert books" on public.books for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update books" on public.books;
create policy "Admins can update books" on public.books for update to authenticated
using (public.has_role(p_role => 'admin')) with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can delete books" on public.books;
create policy "Admins can delete books" on public.books for delete to authenticated
using (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can insert chapters" on public.book_chapters;
create policy "Admins can insert chapters" on public.book_chapters for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update chapters" on public.book_chapters;
create policy "Admins can update chapters" on public.book_chapters for update to authenticated
using (public.has_role(p_role => 'admin')) with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can insert sections" on public.book_sections;
create policy "Admins can insert sections" on public.book_sections for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update sections" on public.book_sections;
create policy "Admins can update sections" on public.book_sections for update to authenticated
using (public.has_role(p_role => 'admin')) with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can insert objectives" on public.learning_objectives;
create policy "Admins can insert objectives" on public.learning_objectives for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update objectives" on public.learning_objectives;
create policy "Admins can update objectives" on public.learning_objectives for update to authenticated
using (public.has_role(p_role => 'admin')) with check (public.has_role(p_role => 'admin'));

-- Processing metadata and reset RPC required by the Book Library UI.
alter table public.books
  add column if not exists processing_error text,
  add column if not exists indexed_at timestamptz,
  add column if not exists indexed_chapter_count integer not null default 0,
  add column if not exists indexed_section_count integer not null default 0,
  add column if not exists indexed_objective_count integer not null default 0;

create index if not exists books_processing_status_idx
  on public.books(processing_status, created_at desc);

create or replace function public.reset_book_index(p_book_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role(p_role => 'admin') then
    raise exception 'Administrator access required';
  end if;
  delete from public.learning_objectives where book_id = p_book_id;
  delete from public.book_chapters where book_id = p_book_id;
  update public.books
  set processing_status = 'pending', processing_error = null, indexed_at = null,
      indexed_chapter_count = 0, indexed_section_count = 0, indexed_objective_count = 0,
      updated_at = now()
  where id = p_book_id;
end;
$$;

revoke all on function public.reset_book_index(uuid) from public, anon;
grant execute on function public.reset_book_index(uuid) to authenticated;
