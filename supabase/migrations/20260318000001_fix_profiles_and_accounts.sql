-- 1. Update the handle_new_user trigger to include connected_people from metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, connected_people)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(
      -- Try to parse the connected_people JSON array, fallback to empty array if fails or null
      case 
        when new.raw_user_meta_data->>'connected_people' is not null 
        then cast(new.raw_user_meta_data->>'connected_people' as jsonb)
        else '[]'::jsonb 
      end,
      '[]'::jsonb
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create a secure function to fetch all accounts (including email from auth schema)
-- Dropped the previous function to ensure the return type signature matches cleanly
drop function if exists public.get_all_accounts();

create or replace function public.get_all_accounts()
returns table(
  id uuid, 
  full_name text, 
  role text, 
  email varchar, 
  connected_people jsonb
) 
language sql
security definer
set search_path = public
as $$
  select 
    p.id,
    p.full_name,
    p.role,
    u.email::varchar,
    p.connected_people
  from public.profiles p
  join auth.users u on p.id = u.id
  where exists (
    select 1 from public.profiles admin_check 
    where admin_check.id = auth.uid() and admin_check.role = 'admin'
  )
  order by p.role asc, p.full_name asc;
$$;
