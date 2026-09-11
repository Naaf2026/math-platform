-- ============================================================
-- FAHI VISSNUN Math Learning Platform
-- Migration 0019 — Secure role registration
-- ============================================================

create or replace function public.register_user_role(p_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_role not in ('student','teacher','parent','guardian') then
    raise exception 'Invalid registration role';
  end if;

  insert into public.user_roles(user_id, role)
  values (auth.uid(), p_role)
  on conflict (user_id) do update
    set role = excluded.role,
        updated_at = now();

  return p_role;
end;
$$;

revoke all on function public.register_user_role(text) from public, anon;
grant execute on function public.register_user_role(text) to authenticated;

select to_regprocedure('public.register_user_role(text)') as register_user_role;
