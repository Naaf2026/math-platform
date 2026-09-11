-- ============================================================
-- FAHI VISSNUN Math Learning Platform
-- Migration 0020
-- Admin User Management
-- ============================================================

-- Admin-only role management for public roles.
-- Admin promotion is deliberately excluded from this RPC.
create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role('admin') then
    raise exception 'Administrator access is required';
  end if;

  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  if p_role not in ('student','teacher','parent','guardian') then
    raise exception 'Only student, teacher, parent or guardian roles can be assigned here';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User profile not found';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Use a separate administrator workflow to change your own role';
  end if;

  insert into public.user_roles(user_id, role)
  values (p_user_id, p_role)
  on conflict (user_id) do update
    set role = excluded.role,
        updated_at = now();

  return p_role;
end;
$$;

revoke all on function public.admin_set_user_role(uuid,text) from public, anon;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated;

select to_regprocedure('public.admin_set_user_role(uuid,text)') as admin_set_user_role;

-- ============================================================
-- END OF MIGRATION 0020
-- ============================================================
