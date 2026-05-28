-- Vendor directory (contacts for procurement)
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gst_number text,
  contact_name text,
  phone_number text,
  place text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.vendors enable row level security;

create policy "Vendors viewable by authenticated users"
  on public.vendors for select
  to authenticated
  using (true);

create policy "Authenticated users can insert vendors"
  on public.vendors for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update vendors"
  on public.vendors for update
  to authenticated
  using (true);

create policy "Authenticated users can delete vendors"
  on public.vendors for delete
  to authenticated
  using (true);
