-- Migration: Update RPC for fetching student assessments to include a leaderboard of all students in the assessment.

drop function if exists public.get_student_assessments(uuid);

create or replace function public.get_student_assessments(target_student_id uuid)
returns table(
  id uuid, 
  created_at timestamp with time zone, 
  comment text, 
  maximum_mark numeric, 
  student_mark numeric,
  group_name text,
  leaderboard jsonb
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
    return query select null::uuid, null::timestamp with time zone, null::text, null::numeric, null::numeric, null::text, null::jsonb limit 0;
    return;
  end if;

  -- 2. Fetch assessments securely
  return query
  select 
    a.id,
    a.created_at,
    a.comment,
    a.maximum_mark,
    cast(a.results->>target_student_id::text as numeric) as student_mark,
    g.name as group_name,
    (
      select jsonb_agg(
        jsonb_build_object(
          'student_id', s.id,
          'student_name', s.first_name || ' ' || s.last_name,
          'mark', cast(kv.value as numeric)
        ) order by cast(kv.value as numeric) desc
      )
      from jsonb_each_text(a.results) kv
      join public.students s on s.id::text = kv.key
    ) as leaderboard
  from public.assessments a
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
