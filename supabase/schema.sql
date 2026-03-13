-- Supabase Schema Setup for Ar-Roshidoniy School

-- 1. Create a Profiles table to store user roles (Student vs Admin)
-- This table links directly to Supabase's built-in auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('student', 'admin')),
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  attended_groups uuid[] default '{}'::uuid[],
  responsible_groups uuid[] default '{}'::uuid[]
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


-- 4. Create Groups table
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  responsible_teachers uuid[] default '{}'::uuid[],
  opening_date date,
  tuition_fee numeric
);

alter table public.groups enable row level security;

-- All authenticated users (students + admins) can view groups
create policy "Authenticated users can view groups"
  on public.groups for select
  using (auth.uid() is not null);

-- Only admins can insert/update/delete groups
create policy "Admins can manage groups"
  on public.groups for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 5. Create Timetable table
create table public.timetable (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  day_of_week integer check (day_of_week between 1 and 7),
  time_slot time not null,
  room text not null check (room in ('101', '102', '103', '201', '202', '203', 'B1', 'B2', 'Outdoor')),
  group_ids uuid[] default '{}'::uuid[],
  unique (day_of_week, time_slot, room)
);

alter table public.timetable enable row level security;

-- All authenticated users can view the timetable
create policy "Authenticated users can view timetable"
  on public.timetable for select
  using (auth.uid() is not null);

-- Only admins can modify the timetable
create policy "Admins can manage timetable"
  on public.timetable for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 6. Create Assessments table
create table public.assessments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  teacher_ids uuid[] default '{}'::uuid[],
  group_ids uuid[] default '{}'::uuid[],
  comment text,
  maximum_mark numeric,
  results jsonb default '{}'::jsonb
);

alter table public.assessments enable row level security;

-- All authenticated users can view assessments
create policy "Authenticated users can view assessments"
  on public.assessments for select
  using (auth.uid() is not null);

-- Only admins can manage assessments
create policy "Admins can manage assessments"
  on public.assessments for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 7. Create Messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sender_id uuid references public.profiles(id) on delete set null,
  receiver_id uuid references public.profiles(id) on delete cascade,
  subject text,
  content text
);

alter table public.messages enable row level security;

-- Users can see messages they sent or received
create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Authenticated users can send messages
create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);
