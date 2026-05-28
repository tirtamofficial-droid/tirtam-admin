-- Product kits reference (what goes into each kit we sell)
create table if not exists public.product_kits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.product_kits is 'Internal reference for ritual kits and included products';
comment on column public.product_kits.items is 'JSON array of { name, item_type, purpose }';

alter table public.product_kits enable row level security;

create policy "Product kits viewable by authenticated users"
  on public.product_kits for select
  to authenticated
  using (true);

create policy "Authenticated users can insert product kits"
  on public.product_kits for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update product kits"
  on public.product_kits for update
  to authenticated
  using (true);

create policy "Authenticated users can delete product kits"
  on public.product_kits for delete
  to authenticated
  using (true);

insert into public.product_kits (name, items) values
(
  'Wealth & Abundance',
  '[
    {"name": "Citrine Bracelet", "item_type": "Bracelet", "purpose": "Abundance + confidence + financial positivity."},
    {"name": "Pyrite Stone", "item_type": "Tumble", "purpose": ""},
    {"name": "7 Mukhi Rudraksha", "item_type": "", "purpose": ""},
    {"name": "Wealth Pyramid", "item_type": "Desk", "purpose": ""},
    {"name": "Lakshmi Yantra Card", "item_type": "Pooja", "purpose": ""},
    {"name": "Sage", "item_type": "Cleansing", "purpose": ""},
    {"name": "Charging bowl", "item_type": "Cleansing", "purpose": ""}
  ]'::jsonb
),
(
  'Couple Kit',
  '[
    {"name": "Rose Quartz *2", "item_type": "Bracelet", "purpose": ""},
    {"name": "Rose Quartz Heart", "item_type": "Tumble", "purpose": ""},
    {"name": "Moonstone", "item_type": "Stone-Desk", "purpose": ""},
    {"name": "Love Card", "item_type": "", "purpose": ""},
    {"name": "Sage", "item_type": "Cleansing", "purpose": ""},
    {"name": "Charging bowl", "item_type": "Cleansing", "purpose": ""}
  ]'::jsonb
);
