-- Parents and guardians may update only their own display name.
-- Direct writes to profiles remain revoked from browser roles.
create or replace function public.update_my_parent_profile(p_full_name text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := btrim(coalesce(p_full_name, ''));
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role in ('parent', 'guardian')
  ) then raise exception 'Parent access required'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Name must be between 2 and 100 characters';
  end if;
  update public.profiles
  set full_name = v_name, display_name = v_name, updated_at = now()
  where id = v_user_id;
  if not found then raise exception 'Profile not found'; end if;
  return v_name;
end;
$$;
revoke all on function public.update_my_parent_profile(text) from public, anon;
grant execute on function public.update_my_parent_profile(text) to authenticated;
