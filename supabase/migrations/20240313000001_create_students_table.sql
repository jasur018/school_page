-- Migration: Create students table and refactor profiles
-- 1. Create the students table
CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth date,
    grade text,
    attending_groups uuid[] DEFAULT '{}'::uuid[],
    join_date date DEFAULT CURRENT_DATE,
    guardian_full_name text,
    guardian_phone text,
    address text,
    status text DEFAULT 'studying' CHECK (status IN ('studying', 'left_school')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Refactor profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS attended_groups;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS responsible_groups;

-- 3. Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for students
-- Admins can do everything
CREATE POLICY "Admins can manage all students"
ON public.students FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Students/Guardians can view their linked student records
CREATE POLICY "Users can view linked student records"
ON public.students FOR SELECT
USING (profile_id = auth.uid());

-- 5. Updated RLS for profiles (Optional cleanup if needed, but keeping full_name as requested)
-- Profiles RLS already exists: "Users can view own profile"
-- We might want admins to be able to see profiles to link them to students
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);
