-- Migration: Create Announcements table and enforcement logic

-- 1. Create the announcements table
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('admission', 'discount', 'generic')),
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}'::JSONB,
    image_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Everyone can view announcements
CREATE POLICY "Anyone can view announcements"
    ON public.announcements FOR SELECT
    USING (now() < expires_at);

-- Only admins can manage announcements
CREATE POLICY "Admins can manage announcements"
    ON public.announcements FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Enforcement Trigger: Limit to 7 announcements
CREATE OR REPLACE FUNCTION public.enforce_announcement_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT count(*) FROM public.announcements) >= 7 THEN
        RAISE EXCEPTION 'Maximum limit of 7 announcements reached. Please delete an old one first.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_announcements_trigger
    BEFORE INSERT ON public.announcements
    FOR EACH ROW EXECUTE PROCEDURE public.enforce_announcement_limit();

-- 5. Index for performance
CREATE INDEX announcements_expires_at_idx ON public.announcements (expires_at);
