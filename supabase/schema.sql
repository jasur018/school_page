-- Supabase Schema Setup for Ar-Roshidoniy School

-- 1. Create a Profiles table to store user roles (Student vs Admin)
-- This table links directly to Supabase's built-in auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('student', 'admin')),
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Users can read their own profile (sufficient for login flow)
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);
-- NOTE: The previous "Admins can view all profiles" policy was removed.
-- It caused infinite recursion (querying profiles inside a policy ON profiles → 500 error).
-- Admins viewing all profiles will be handled via a security-definer function in the future.


-- 2. Create the Applications table (used by the Landing Page form)
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  student_name text not null,
  parent_name text not null,
  email text not null,
  phone text not null,
  grade_level text not null,
  message text,
  status text default 'pending' -- admins can update this (pending, accepted, rejected)
);

-- Enable Row Level Security (RLS) on applications
alter table public.applications enable row level security;

-- Allow anyone to insert (submit) an application (since the form is public)
create policy "Anyone can insert an application"
  on public.applications for insert
  with check (true);

-- Allow only authenticated admins to view/update applications
create policy "Only admins can view applications"
  on public.applications for select
  using (
    -- This checks if the user's role in the profiles table is 'admin'
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Only admins can update applications"
  on public.applications for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


-- 3. Automatically create a profile when an admin provisions a new user
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  -- If role isn't explicitly set in metadata when the admin creates the user, default to student
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'student'));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created via the Supabase Dashboard or Admin API
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
