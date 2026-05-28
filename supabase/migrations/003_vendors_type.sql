-- Vendor category: packaging, products, etc.
alter table public.vendors
  add column if not exists vendor_type text;

comment on column public.vendors.vendor_type is 'Vendor category e.g. Packaging, Products';
