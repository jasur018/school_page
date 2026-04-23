-- Migration: align RLS baseline and add performance-oriented indexes
-- Why:
-- 1) Keep policy/function behavior consistent with the optimized schema baseline.
-- 2) Add missing indexes for common filters and membership checks.
-- 3) Backfill auth metadata so public.is_admin() is reliable for existing users.

-- -----------------------------------------------------------------------------
-- Admin helper function (non-recursive admin check via JWT metadata)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$;

-- -----------------------------------------------------------------------------
-- RLS policy alignment (idempotent)
-- -----------------------------------------------------------------------------

-- profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (id = (select auth.uid()));

drop policy if exists "Admins can view all profiles safely" on public.profiles;
create policy "Admins can view all profiles safely"
  on public.profiles for select
  using (public.is_admin());

-- applications
drop policy if exists "Only admins can view applications" on public.applications;
create policy "Only admins can view applications"
  on public.applications for select
  using (public.is_admin());

drop policy if exists "Only admins can update applications" on public.applications;
create policy "Only admins can update applications"
  on public.applications for update
  using (public.is_admin());

-- groups
drop policy if exists "Authenticated users can view groups" on public.groups;
create policy "Authenticated users can view groups"
  on public.groups for select
  using ((select auth.uid()) is not null);

drop policy if exists "Admins can insert groups" on public.groups;
create policy "Admins can insert groups"
  on public.groups for insert
  with check (public.is_admin());

drop policy if exists "Admins can update groups" on public.groups;
create policy "Admins can update groups"
  on public.groups for update
  using (public.is_admin());

drop policy if exists "Admins can delete groups" on public.groups;
create policy "Admins can delete groups"
  on public.groups for delete
  using (public.is_admin());

-- timetable
drop policy if exists "Authenticated users can view timetable" on public.timetable;
create policy "Authenticated users can view timetable"
  on public.timetable for select
  using ((select auth.uid()) is not null);

drop policy if exists "Admins can insert timetable" on public.timetable;
create policy "Admins can insert timetable"
  on public.timetable for insert
  with check (public.is_admin());

drop policy if exists "Admins can update timetable" on public.timetable;
create policy "Admins can update timetable"
  on public.timetable for update
  using (public.is_admin());

drop policy if exists "Admins can delete timetable" on public.timetable;
create policy "Admins can delete timetable"
  on public.timetable for delete
  using (public.is_admin());

-- assessments
drop policy if exists "Authenticated users can view assessments" on public.assessments;
create policy "Authenticated users can view assessments"
  on public.assessments for select
  using ((select auth.uid()) is not null);

drop policy if exists "Admins can insert assessments" on public.assessments;
create policy "Admins can insert assessments"
  on public.assessments for insert
  with check (public.is_admin());

drop policy if exists "Admins can update assessments" on public.assessments;
create policy "Admins can update assessments"
  on public.assessments for update
  using (public.is_admin());

drop policy if exists "Admins can delete assessments" on public.assessments;
create policy "Admins can delete assessments"
  on public.assessments for delete
  using (public.is_admin());

-- messages
drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages"
  on public.messages for select
  using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));

drop policy if exists "Authenticated users can send messages" on public.messages;
create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (sender_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Backfill auth metadata from existing profiles for reliability of is_admin()
-- -----------------------------------------------------------------------------
update auth.users u
set raw_user_meta_data =
  coalesce(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', p.role)
  || case
      when p.full_name is not null then jsonb_build_object('full_name', p.full_name)
      else '{}'::jsonb
     end
from public.profiles p
where p.id = u.id
  and (
    coalesce(u.raw_user_meta_data ->> 'role', '') is distinct from p.role
    or (
      p.full_name is not null
      and coalesce(u.raw_user_meta_data ->> 'full_name', '') is distinct from p.full_name
    )
  );

-- -----------------------------------------------------------------------------
-- Indexes for common filters/joins/membership checks
-- -----------------------------------------------------------------------------

create index if not exists applications_status_created_at_idx
  on public.applications (status, created_at desc);

create index if not exists applications_created_at_idx
  on public.applications (created_at desc);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

create index if not exists messages_receiver_id_idx
  on public.messages (receiver_id);

create index if not exists students_profile_id_idx
  on public.students (profile_id);

create index if not exists students_attending_groups_idx
  on public.students using gin (attending_groups);

create index if not exists groups_responsible_teachers_idx
  on public.groups using gin (responsible_teachers);

create index if not exists timetable_group_ids_idx
  on public.timetable using gin (group_ids);

create index if not exists assessments_teacher_ids_idx
  on public.assessments using gin (teacher_ids);

create index if not exists assessments_group_ids_idx
  on public.assessments using gin (group_ids);

create index if not exists assessments_results_idx
  on public.assessments using gin (results);

create index if not exists broadcasts_recipient_ids_idx
  on public.broadcasts using gin (recipient_ids);
