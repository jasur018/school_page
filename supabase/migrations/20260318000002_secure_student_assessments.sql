-- Migration: Create a secure RPC for fetching student assessments to prevent data leakage

-- Create a secure function to fetch assessments for a specific student
-- It checks if the caller is authorized to view this student,
-- finds assessments for the student's groups, and only returns the student's specific mark.
drop function if exists public.get_student_assessments(uuid);

create or replace function public.get_student_assessments(target_student_id uuid)
returns table(
  id uuid, 
  created_at timestamp with time zone, 
  comment text, 
  maximum_mark numeric, 
  student_mark numeric,
  group_name text
) 
language plpgsql
security definer
as $$
declare
  is_authorized boolean;
begin
  -- 1. Check if the user is authorized to view this student.
  -- A user can view if they are an Admin, OR if their profile_id matches the student's profile_id.
  select exists (
    select 1 from public.students s
    left join public.profiles p on p.id = auth.uid()
    where s.id = target_student_id
    and (
      s.profile_id = auth.uid() -- It's their child
      or p.role = 'admin'       -- They are an admin
    )
  ) into is_authorized;

  -- If not authorized, return empty.
  if not is_authorized then
    return query select null::uuid, null::timestamp with time zone, null::text, null::numeric, null::numeric, null::text limit 0;
    return;
  end if;

  -- 2. Fetch assessments securely
  return query
  select 
    a.id,
    a.created_at,
    a.comment,
    a.maximum_mark,
    -- Extract only the specific student's mark from the JSONB results object, cast to numeric
    cast(a.results->>target_student_id::text as numeric) as student_mark,
    g.name as group_name
  from public.assessments a
  -- We assume group_ids[1] is the primary group for the assessment based on current logic
  left join public.groups g on g.id = a.group_ids[1]
  where 
    -- The student must be in one of the assessment's groups
    exists (
      select 1 from public.students s 
      where s.id = target_student_id 
      and s.attending_groups && a.group_ids
    )
    -- And they must actually have a grade recorded in the results object
    and a.results ? target_student_id::text
  order by a.created_at desc;
end;
$$;
