-- Products purchased from each vendor (procurement catalog)
create table if not exists public.vendor_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  sku text,
  qty numeric,
  price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_products_vendor_id_idx on public.vendor_products(vendor_id);

alter table public.vendor_products enable row level security;

create policy "Vendor products viewable by authenticated users"
  on public.vendor_products for select
  to authenticated
  using (true);

create policy "Authenticated users can insert vendor products"
  on public.vendor_products for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update vendor products"
  on public.vendor_products for update
  to authenticated
  using (true);

create policy "Authenticated users can delete vendor products"
  on public.vendor_products for delete
  to authenticated
  using (true);
