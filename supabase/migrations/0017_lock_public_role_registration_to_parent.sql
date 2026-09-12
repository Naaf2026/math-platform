-- Public registration is parent-only.
-- Learner accounts are created by a parent through the protected Edge Function.
-- Teacher and admin accounts are provisioned by administrators.

create or replace function public.register_user_role(p_role text)
returns text
language plpgsql
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_role <> 'parent' then
    raise exception 'Public registration is limited to parent accounts';
  end if;

  insert into public.user_roles(user_id, role)
  values (auth.uid(), 'parent')
  on conflict (user_id) do update
    set role = excluded.role,
        updated_at = now();

  return 'parent';
end;
$function$;

revoke execute on function public.register_user_role(text) from anon;
grant execute on function public.register_user_role(text) to authenticated;
