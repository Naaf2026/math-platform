-- Phase 8: Book processing/indexing metadata
-- Gemini processes the private PDF and writes structured curriculum context into Supabase.

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
  set processing_status = 'pending',
      processing_error = null,
      indexed_at = null,
      indexed_chapter_count = 0,
      indexed_section_count = 0,
      indexed_objective_count = 0,
      updated_at = now()
  where id = p_book_id;
end;
$$;

revoke all on function public.reset_book_index(uuid) from public, anon;
grant execute on function public.reset_book_index(uuid) to authenticated;
