-- Harden learner/parent data isolation.
-- Direct client writes are disabled on sensitive learner records; app mutations should use trusted RPCs/functions.
revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
revoke insert, update, delete, truncate on public.user_roles from anon, authenticated;
revoke insert, update, delete, truncate on public.topic_progress from anon, authenticated;
revoke insert, update, delete, truncate on public.lesson_progress from anon, authenticated;
revoke insert, update, delete, truncate on public.student_achievements from anon, authenticated;
revoke insert, update, delete, truncate on public.student_relationships from anon, authenticated;
revoke insert, update, delete, truncate on public.parent_learner_accounts from anon, authenticated;
revoke insert, update, delete, truncate on public.daily_missions from anon, authenticated;
revoke insert, update, delete, truncate on public.daily_mission_questions from anon, authenticated;
revoke insert, update, delete, truncate on public.daily_mission_rewards from anon, authenticated;
revoke insert, update, delete, truncate on public.learning_path_progress from anon, authenticated;

drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;

create policy "Learners can view their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Parents can view linked learner profiles"
on public.profiles for select to authenticated
using (
  exists (
    select 1 from public.student_relationships sr
    where sr.student_id = profiles.id
      and sr.related_user_id = (select auth.uid())
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  )
);

create policy "Parents can view linked learner topic progress"
on public.topic_progress for select to authenticated
using (
  exists (
    select 1 from public.student_relationships sr
    where sr.student_id = topic_progress.user_id
      and sr.related_user_id = (select auth.uid())
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  )
);

create policy "Parents can view linked learner lesson progress"
on public.lesson_progress for select to authenticated
using (
  exists (
    select 1 from public.student_relationships sr
    where sr.student_id = lesson_progress.user_id
      and sr.related_user_id = (select auth.uid())
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  )
);

create policy "Parents can view linked learner achievements"
on public.student_achievements for select to authenticated
using (
  exists (
    select 1 from public.student_relationships sr
    where sr.student_id = student_achievements.user_id
      and sr.related_user_id = (select auth.uid())
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  )
);

create policy "Parents can view linked learner path progress"
on public.learning_path_progress for select to authenticated
using (
  exists (
    select 1 from public.student_relationships sr
    where sr.student_id = learning_path_progress.user_id
      and sr.related_user_id = (select auth.uid())
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  )
);

create policy "Parents can view linked learner missions"
on public.daily_missions for select to authenticated
using (
  exists (
    select 1 from public.student_relationships sr
    where sr.student_id = daily_missions.user_id
      and sr.related_user_id = (select auth.uid())
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  )
);

create policy "Parents can view linked learner mission rewards"
on public.daily_mission_rewards for select to authenticated
using (
  exists (
    select 1 from public.student_relationships sr
    where sr.student_id = daily_mission_rewards.user_id
      and sr.related_user_id = (select auth.uid())
      and sr.relationship in ('parent','guardian')
      and sr.status = 'active'
  )
);

revoke select on public.profiles, public.user_roles, public.topic_progress, public.lesson_progress,
  public.student_achievements, public.student_relationships, public.parent_learner_accounts,
  public.daily_missions, public.daily_mission_questions, public.daily_mission_rewards,
  public.learning_path_progress from anon;

-- SECURITY DEFINER functions must never be callable anonymously.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef = true
  loop
    execute format('revoke execute on function %s from anon', r.signature);
  end loop;
end $$;

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.set_parent_learning_goal_updated_at() set search_path = public, pg_temp;
