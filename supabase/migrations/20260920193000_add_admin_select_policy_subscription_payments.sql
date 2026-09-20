-- Allow admin users to see submitted payment slips in Admin > Payments.
-- Review/update actions already require admin privileges; this policy supplies
-- the missing SELECT permission used by the admin payment list.
create policy "Admins can view payments"
on public.subscription_payments
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in ('admin','super_admin')
  )
);
