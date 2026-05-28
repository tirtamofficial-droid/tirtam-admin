-- ============================================================
-- TIRTAM OS — Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. EMPLOYEES TABLE
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  role text not null default 'Member',
  avatar text not null default '',
  department text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.employees enable row level security;

create policy "Employees are viewable by authenticated users"
  on public.employees for select
  to authenticated
  using (true);

create policy "Admins can insert employees"
  on public.employees for insert
  to authenticated
  with check (
    exists (select 1 from public.employees where auth_user_id = auth.uid() and is_admin = true)
  );

create policy "Admins can update employees"
  on public.employees for update
  to authenticated
  using (
    exists (select 1 from public.employees where auth_user_id = auth.uid() and is_admin = true)
  );


-- 2. TASKS TABLE
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner uuid not null references public.employees(id),
  department text not null,
  priority text not null default 'Medium' check (priority in ('Critical', 'High', 'Medium', 'Low')),
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Blocked', 'Review', 'Completed')),
  deadline timestamptz not null,
  notes text not null default '',
  dependencies uuid[] not null default '{}',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Tasks are viewable by authenticated users"
  on public.tasks for select
  to authenticated
  using (true);

create policy "Authenticated users can create tasks"
  on public.tasks for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update tasks"
  on public.tasks for update
  to authenticated
  using (true);

create policy "Admins can delete tasks"
  on public.tasks for delete
  to authenticated
  using (
    exists (select 1 from public.employees where auth_user_id = auth.uid() and is_admin = true)
  );

-- Auto-update updated_at on tasks
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();


-- 3. ACTIVITIES TABLE (append-only log)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.employees(id),
  user_name text not null,
  action text not null check (action in ('created', 'updated', 'completed', 'moved', 'assigned', 'commented')),
  task_id uuid not null references public.tasks(id) on delete cascade,
  task_name text not null,
  details text not null,
  department text not null,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Activities are viewable by authenticated users"
  on public.activities for select
  to authenticated
  using (true);

create policy "Authenticated users can insert activities"
  on public.activities for insert
  to authenticated
  with check (true);


-- 4. WHATSAPP CONFIGURATION (singleton row)
create table if not exists public.whatsapp_config (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default false,
  send_time text not null default '09:00',
  phone_number text not null default '',
  group_name text not null default 'Tirtam Operations',
  twilio_account_sid text not null default '',
  twilio_auth_token text not null default '',
  twilio_from_number text not null default '',
  last_sent timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_config enable row level security;

create policy "Config viewable by admins"
  on public.whatsapp_config for select
  to authenticated
  using (
    exists (select 1 from public.employees where auth_user_id = auth.uid() and is_admin = true)
  );

create policy "Admins can update config"
  on public.whatsapp_config for update
  to authenticated
  using (
    exists (select 1 from public.employees where auth_user_id = auth.uid() and is_admin = true)
  );

-- Insert default config row
insert into public.whatsapp_config (enabled, send_time, group_name) values (false, '09:00', 'Tirtam Operations');


-- 5. ENABLE REALTIME for tasks and activities
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.activities;


-- 6. SEED: Insert default employees (update auth_user_id after auth signup)
insert into public.employees (name, email, role, avatar, department, is_admin) values
  ('Rahul Sharma', 'rahul@tirtam.in', 'Founder & CEO', 'RS', 'Operations & Logistics', true),
  ('Arun Mehta', 'arun@tirtam.in', 'Product Lead', 'AM', 'Packaging & Product', false),
  ('Akash Verma', 'akash@tirtam.in', 'Tech Lead', 'AV', 'Technology', false),
  ('Priya Patel', 'priya@tirtam.in', 'Marketing Head', 'PP', 'Marketing & Branding', false),
  ('Sneha Gupta', 'sneha@tirtam.in', 'Operations Manager', 'SG', 'Operations & Logistics', false);
