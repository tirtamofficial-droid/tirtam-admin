-- Standalone notes (name + description)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Notes viewable by authenticated users"
  on public.notes for select
  to authenticated
  using (true);

create policy "Authenticated users can insert notes"
  on public.notes for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update notes"
  on public.notes for update
  to authenticated
  using (true);

create policy "Authenticated users can delete notes"
  on public.notes for delete
  to authenticated
  using (true);
