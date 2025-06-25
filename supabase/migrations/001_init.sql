-- Enable PostGIS
create extension if not exists "postgis";

-- Projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null,
  description text,
  geom geometry(Point, 4326) not null,
  is_public boolean default true,
  inserted_at timestamptz default now()
);

-- Row‐level security
alter table public.projects enable row level security;

create policy "Public or owner can select" on projects
  for select using (
    is_public
    or auth.uid() = user_id
  );

create policy "Owner can insert" on projects
  for insert with check (
    auth.uid() = user_id
  );
