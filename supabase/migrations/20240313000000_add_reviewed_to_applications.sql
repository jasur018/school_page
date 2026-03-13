-- Migration: Add reviewed column to applications table
ALTER TABLE public.applications 
ADD COLUMN reviewed boolean DEFAULT false;

-- Update existing records to be marked as reviewed if they are not 'pending'
-- This ensures a clean transition if there's already data.
UPDATE public.applications 
SET reviewed = true 
WHERE status != 'pending';
