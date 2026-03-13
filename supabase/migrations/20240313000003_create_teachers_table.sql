-- Migration: Create teachers table and sync from profiles
-- 1. Create the teachers table
CREATE TABLE public.teachers (
    id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    speciality text,
    responsible_groups uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create function to sync admin profiles to teachers
CREATE OR REPLACE FUNCTION public.sync_profile_to_teacher()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role = 'admin') THEN
        INSERT INTO public.teachers (id, full_name)
        VALUES (NEW.id, NEW.full_name)
        ON CONFLICT (id) DO UPDATE
        SET full_name = EXCLUDED.full_name;
    ELSIF (OLD.role = 'admin' AND NEW.role != 'admin') THEN
        DELETE FROM public.teachers WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_sync_teacher ON public.profiles;
CREATE TRIGGER on_profile_sync_teacher
    AFTER INSERT OR UPDATE OF role, full_name ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.sync_profile_to_teacher();

-- 4. Initial migration for existing admins
INSERT INTO public.teachers (id, full_name)
SELECT id, full_name FROM public.profiles 
WHERE role = 'admin'
ON CONFLICT (id) DO NOTHING;

-- 5. Enable RLS on teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for teachers
CREATE POLICY "Anyone authenticated can view teachers"
ON public.teachers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage teachers"
ON public.teachers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
