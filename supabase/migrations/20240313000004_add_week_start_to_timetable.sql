-- Migration: Add week_start to timetable table
ALTER TABLE public.timetable ADD COLUMN week_start date;

-- Add a comment explaining the column
COMMENT ON COLUMN public.timetable.week_start IS 'The start date (Monday) of the week for this timetable entry. If NULL, it could be treated as a template entry (optional).';

-- Update unique constraint to include week_start
ALTER TABLE public.timetable DROP CONSTRAINT IF EXISTS timetable_day_of_week_time_slot_room_key;
ALTER TABLE public.timetable ADD CONSTRAINT timetable_week_day_slot_room_key UNIQUE (week_start, day_of_week, time_slot, room);

-- Update existing entries to the current week's Monday if they are NULL
-- First, get the current week's Monday
DO $$
DECLARE
    current_monday date;
BEGIN
    current_monday := CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer - 1 + 7) % 7;
    UPDATE public.timetable SET week_start = current_monday WHERE week_start IS NULL;
END $$;

-- Make week_start NOT NULL after populating existing data
-- ALTER TABLE public.timetable ALTER COLUMN week_start SET NOT NULL; -- Keeping it nullable for now just in case
