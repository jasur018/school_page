-- Run this in the Supabase SQL Editor to manually insert a profile for a user
-- who was created BEFORE the trigger was set up.
-- Replace 'your-user-uuid-here' with the actual UUID from the Authentication tab,
-- and set the role to either 'admin' or 'student'.

-- Keep auth metadata in sync with the profile row so the optimized is_admin()
-- check continues to work for manually provisioned users.
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('full_name', 'Alpha', 'role', 'admin')
where id = '79e65574-9eac-4abd-ac4a-96624c809c43';

insert into public.profiles (id, full_name, role)
values (
  '79e65574-9eac-4abd-ac4a-96624c809c43',   -- copy this from Authentication > Users in the Supabase dashboard
  'Alpha',
  'admin'                  -- or 'student'
)
on conflict (id) do update
set full_name = excluded.full_name,
    role = excluded.role;
