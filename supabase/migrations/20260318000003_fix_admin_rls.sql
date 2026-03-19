-- Migration: Fix Admin RLS by using a Security Definer function
-- When RLS policies do subqueries on other RLS-enabled tables (like profiles) during an INSERT, 
-- it often causes 42501 / 403 errors due to context evaluation or silent infinite recursion loops.
-- The Supabase recommended practice is to use a `security definer` function to retrieve the user role.

-- 1. Create the secure admin check function
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  -- Use JWT metadata to prevent recursive RLS lookups on the profiles table
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$;

-- 2. Update `groups` policies
drop policy if exists "Admins can manage groups" on public.groups;
create policy "Admins can manage groups"
  on public.groups for all
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Update `students` policies
drop policy if exists "Admins can manage all students" on public.students;
create policy "Admins can manage all students"
  on public.students for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Update `assessments` policies
drop policy if exists "Admins can manage assessments" on public.assessments;
create policy "Admins can manage assessments"
  on public.assessments for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Update `timetable` policies
drop policy if exists "Admins can manage timetable" on public.timetable;
create policy "Admins can manage timetable"
  on public.timetable for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Update `teachers` policies
drop policy if exists "Admins can manage teachers" on public.teachers;
create policy "Admins can manage teachers"
  on public.teachers for all
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Fix profiles recursion if it exists
-- Drop any conflicting policies that might cause infinite loops just in case
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Add safely using the function
create policy "Admins can view all profiles safely"
  on public.profiles for select
  using (public.is_admin());
