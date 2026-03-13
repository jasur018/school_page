-- Migration to add broadcasts table for multi-recipient messaging
create table public.broadcasts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sender_id uuid references public.profiles(id) on delete set null,
  recipient_ids uuid[] not null default '{}'::uuid[],
  subject text not null,
  content text not null
);

-- Enable RLS
alter table public.broadcasts enable row level security;

-- Admins can manage all broadcasts
create policy "Admins can manage broadcasts"
  on public.broadcasts for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Users can view broadcasts where they are recipients
create policy "Users can view received broadcasts"
  on public.broadcasts for select
  using (
    auth.uid() = any(recipient_ids)
  );
