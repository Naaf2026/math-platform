-- Phase 7: Book Library storage and administrator write access
-- Books are permanently stored in Supabase Storage; Gemini is used only for processing/generation.

insert into storage.buckets (id, name, public)
values ('curriculum-books', 'curriculum-books', false)
on conflict (id) do update set public = false;

-- Administrator-only catalogue writes.
drop policy if exists "Admins can insert curriculums" on public.curriculums;
create policy "Admins can insert curriculums"
on public.curriculums for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update curriculums" on public.curriculums;
create policy "Admins can update curriculums"
on public.curriculums for update to authenticated
using (public.has_role(p_role => 'admin'))
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can insert books" on public.books;
create policy "Admins can insert books"
on public.books for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update books" on public.books;
create policy "Admins can update books"
on public.books for update to authenticated
using (public.has_role(p_role => 'admin'))
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can delete books" on public.books;
create policy "Admins can delete books"
on public.books for delete to authenticated
using (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can insert chapters" on public.book_chapters;
create policy "Admins can insert chapters"
on public.book_chapters for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update chapters" on public.book_chapters;
create policy "Admins can update chapters"
on public.book_chapters for update to authenticated
using (public.has_role(p_role => 'admin'))
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can insert sections" on public.book_sections;
create policy "Admins can insert sections"
on public.book_sections for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update sections" on public.book_sections;
create policy "Admins can update sections"
on public.book_sections for update to authenticated
using (public.has_role(p_role => 'admin'))
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can insert objectives" on public.learning_objectives;
create policy "Admins can insert objectives"
on public.learning_objectives for insert to authenticated
with check (public.has_role(p_role => 'admin'));

drop policy if exists "Admins can update objectives" on public.learning_objectives;
create policy "Admins can update objectives"
on public.learning_objectives for update to authenticated
using (public.has_role(p_role => 'admin'))
with check (public.has_role(p_role => 'admin'));

-- Private book files: only authenticated administrators may access them.
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
