-- Store a parent contact number without enabling direct profile writes.
alter table public.profiles add column if not exists mobile_phone text;

drop function if exists public.update_my_parent_profile(text);

create function public.update_my_parent_profile(p_full_name text, p_mobile_phone text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := regexp_replace(coalesce(p_mobile_phone, ''), '[[:space:]()-]', '', 'g');
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.user_roles
    where user_id = v_user_id and role in ('parent', 'guardian')
  ) then raise exception 'Parent access required'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Name must be between 2 and 100 characters'; end if;
  if v_phone !~ '^[+][1-9][0-9]{7,14}$' then
    raise exception 'Enter a mobile number with country code, for example +9607777777'; end if;
  update public.profiles
  set full_name = v_name, display_name = v_name,
      mobile_phone = v_phone, updated_at = now()
  where id = v_user_id;
  if not found then raise exception 'Profile not found'; end if;
  return v_name;
end;
$$;
revoke all on function public.update_my_parent_profile(text, text) from public, anon;
grant execute on function public.update_my_parent_profile(text, text) to authenticated;

-- New email signups can provide their contact number before email confirmation.
-- The existing profile-creation trigger runs first (alphabetical trigger order).
create or replace function public.capture_signup_mobile_phone()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text := regexp_replace(coalesce(new.raw_user_meta_data->>'mobile_phone', ''), '[[:space:]()-]', '', 'g');
begin
  if v_phone ~ '^[+][1-9][0-9]{7,14}$' then
    update public.profiles set mobile_phone = v_phone where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.capture_signup_mobile_phone() from public, anon, authenticated;
drop trigger if exists zz_capture_signup_mobile_phone on auth.users;
create trigger zz_capture_signup_mobile_phone
after insert on auth.users for each row
execute function public.capture_signup_mobile_phone();
