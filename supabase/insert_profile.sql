-- Run this in the Supabase SQL Editor to manually insert a profile for a user
-- who was created BEFORE the trigger was set up.
-- Replace 'your-user-uuid-here' with the actual UUID from the Authentication tab,
-- and set the role to either 'admin' or 'student'.

INSERT INTO public.profiles (id, full_name, role)
VALUES (
  '79e65574-9eac-4abd-ac4a-96624c809c43',   -- copy this from Authentication > Users in the Supabase dashboard
  'Alpha',
  'admin'                  -- or 'student'
);
