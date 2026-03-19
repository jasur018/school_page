-- Migration: Fix Admin Auth Timeout by breaking RLS recursion
-- This migration updates the is_admin() function to use JWT metadata 
-- instead of querying the profiles table directly, which was causing 
-- an infinite recursion loop and timing out the authentication check.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  -- Check user role from session metadata to avoid recursive table lookups
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin';
$$;

-- Ensure the select policy on profiles is using the fixed is_admin()
drop policy if exists "Admins can view all profiles safely" on public.profiles;
create policy "Admins can view all profiles safely"
  on public.profiles for select
  using (public.is_admin());
