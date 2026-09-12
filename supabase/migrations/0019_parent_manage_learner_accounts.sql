create or replace function public.parent_set_learner_account_status(p_learner_id uuid, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent_id uuid := auth.uid();
  v_status text := case when p_enabled then 'active' else 'disabled' end;
begin
  if v_parent_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.parent_learner_accounts pla
    where pla.learner_id = p_learner_id and pla.parent_id = v_parent_id
  ) then
    raise exception 'Learner is not linked to this parent';
  end if;
  update public.profiles
  set account_status = v_status, updated_at = now()
  where id = p_learner_id;
  return true;
end;
$$;

revoke all on function public.parent_set_learner_account_status(uuid, boolean) from public, anon;
grant execute on function public.parent_set_learner_account_status(uuid, boolean) to authenticated;
