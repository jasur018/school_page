-- =========================================================================
-- OPTIMIZE RLS PERFORMANCE AND RULES
-- Resolves two Supabase Advisor Warnings:
-- 1. auth_rls_initplan: Replacing `auth.uid()` with `(select auth.uid())`
-- 2. multiple_permissive_policies: Splitting FOR ALL into INSERT/UPDATE/DELETE 
--    where SELECT is already covered by a broader authenticated-user policy.
-- =========================================================================

-- 1. PROFILES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (id = (select auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (id = (select auth.uid()));

-- 2. APPLICATIONS
drop policy if exists "Only admins can view applications" on public.applications;
create policy "Only admins can view applications" on public.applications for select using (public.is_admin());

drop policy if exists "Only admins can update applications" on public.applications;
create policy "Only admins can update applications" on public.applications for update using (public.is_admin());

-- 3. GROUPS
drop policy if exists "Authenticated users can view groups" on public.groups;
create policy "Authenticated users can view groups" on public.groups for select using ((select auth.uid()) is not null);

drop policy if exists "Admins can manage groups" on public.groups;
create policy "Admins can insert groups" on public.groups for insert with check (public.is_admin());
create policy "Admins can update groups" on public.groups for update using (public.is_admin());
create policy "Admins can delete groups" on public.groups for delete using (public.is_admin());

-- 4. TIMETABLE
drop policy if exists "Authenticated users can view timetable" on public.timetable;
create policy "Authenticated users can view timetable" on public.timetable for select using ((select auth.uid()) is not null);

drop policy if exists "Admins can manage timetable" on public.timetable;
create policy "Admins can insert timetable" on public.timetable for insert with check (public.is_admin());
create policy "Admins can update timetable" on public.timetable for update using (public.is_admin());
create policy "Admins can delete timetable" on public.timetable for delete using (public.is_admin());

-- 5. ASSESSMENTS
drop policy if exists "Authenticated users can view assessments" on public.assessments;
create policy "Authenticated users can view assessments" on public.assessments for select using ((select auth.uid()) is not null);

drop policy if exists "Admins can manage assessments" on public.assessments;
create policy "Admins can insert assessments" on public.assessments for insert with check (public.is_admin());
create policy "Admins can update assessments" on public.assessments for update using (public.is_admin());
create policy "Admins can delete assessments" on public.assessments for delete using (public.is_admin());

-- 6. TEACHERS
drop policy if exists "Anyone authenticated can view teachers" on public.teachers;
create policy "Anyone authenticated can view teachers" on public.teachers for select using ((select auth.uid()) is not null);

drop policy if exists "Admins can manage teachers" on public.teachers;
create policy "Admins can insert teachers" on public.teachers for insert with check (public.is_admin());
create policy "Admins can update teachers" on public.teachers for update using (public.is_admin());
create policy "Admins can delete teachers" on public.teachers for delete using (public.is_admin());

-- 7. MESSAGES
drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages" on public.messages for select using (
  sender_id = (select auth.uid()) OR receiver_id = (select auth.uid())
);

drop policy if exists "Authenticated users can send messages" on public.messages;
create policy "Authenticated users can send messages" on public.messages for insert with check (
  sender_id = (select auth.uid())
);

-- 8. STUDENTS
drop policy if exists "Users can view linked student records" on public.students;
create policy "Users can view linked student records" on public.students for select using (
  profile_id = (select auth.uid())
);

drop policy if exists "Admins can manage all students" on public.students;
create policy "Admins can view all students" on public.students for select using (public.is_admin());
create policy "Admins can insert students" on public.students for insert with check (public.is_admin());
create policy "Admins can update students" on public.students for update using (public.is_admin());
create policy "Admins can delete students" on public.students for delete using (public.is_admin());

-- 9. BROADCASTS
drop policy if exists "Users can view received broadcasts" on public.broadcasts;
create policy "Users can view received broadcasts" on public.broadcasts for select using (
  (select auth.uid()) = any(recipient_ids)
);

drop policy if exists "Admins can manage broadcasts" on public.broadcasts;
create policy "Admins can view ALL broadcasts" on public.broadcasts for select using (public.is_admin());
create policy "Admins can insert broadcasts" on public.broadcasts for insert with check (public.is_admin());
create policy "Admins can update broadcasts" on public.broadcasts for update using (public.is_admin());
create policy "Admins can delete broadcasts" on public.broadcasts for delete using (public.is_admin());
