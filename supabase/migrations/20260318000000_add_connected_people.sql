-- Migration: Add connected_people to profiles table

-- Add connected_people column to public.profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'connected_people'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN connected_people JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
