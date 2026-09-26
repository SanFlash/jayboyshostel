-- Extended hostel operations. Apply after 001_initial_schema.sql and 002_site_content.sql.

create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  visitor_name text not null,
  phone text,
  relationship text,
  purpose text,
  visit_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  status text not null default 'expected',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete set null,
  reported_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  priority public.priority_level not null default 'normal',
  status text not null default 'open',
  assigned_to uuid references auth.users(id) on delete set null,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  name text not null,
  category text not null default 'general',
  sku text,
  quantity numeric(12,2) not null default 0,
  unit text not null default 'pcs',
  reorder_level numeric(12,2) not null default 0,
  location text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  category text not null default 'general',
  description text not null,
  amount numeric(12,2) not null check(amount >= 0),
  expense_date date not null default current_date,
  vendor text,
  payment_method text not null default 'cash',
  reference text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null default 'present',
  note text,
  marked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(member_id, attendance_date)
);

create table if not exists public.staff_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority public.priority_level not null default 'normal',
  status text not null default 'open',
  due_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check(end_date >= start_date)
);

create index if not exists visitors_date_idx on public.visitors(visit_date);
create index if not exists maintenance_status_idx on public.maintenance_requests(status);
create index if not exists inventory_category_idx on public.inventory_items(category);
create index if not exists expenses_date_idx on public.expenses(expense_date);
create index if not exists attendance_date_idx on public.attendance(attendance_date);
create index if not exists tasks_status_idx on public.staff_tasks(status);
create index if not exists leave_status_idx on public.leave_requests(status);

drop trigger if exists maintenance_requests_updated_at on public.maintenance_requests;
create trigger maintenance_requests_updated_at before update on public.maintenance_requests for each row execute function public.set_updated_at();
drop trigger if exists inventory_items_updated_at on public.inventory_items;
create trigger inventory_items_updated_at before update on public.inventory_items for each row execute function public.set_updated_at();
drop trigger if exists staff_tasks_updated_at on public.staff_tasks;
create trigger staff_tasks_updated_at before update on public.staff_tasks for each row execute function public.set_updated_at();

alter table public.visitors enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.inventory_items enable row level security;
alter table public.expenses enable row level security;
alter table public.attendance enable row level security;
alter table public.staff_tasks enable row level security;
alter table public.leave_requests enable row level security;

drop policy if exists visitors_staff on public.visitors;
create policy visitors_staff on public.visitors for all using(public.is_staff()) with check(public.is_staff());
drop policy if exists maintenance_staff on public.maintenance_requests;
create policy maintenance_staff on public.maintenance_requests for all using(public.is_staff()) with check(public.is_staff());
drop policy if exists inventory_staff on public.inventory_items;
create policy inventory_staff on public.inventory_items for all using(public.is_staff()) with check(public.is_staff());
drop policy if exists expenses_staff on public.expenses;
create policy expenses_staff on public.expenses for all using(public.is_staff()) with check(public.is_staff());
drop policy if exists attendance_staff on public.attendance;
create policy attendance_staff on public.attendance for all using(public.is_staff()) with check(public.is_staff());
drop policy if exists tasks_staff on public.staff_tasks;
create policy tasks_staff on public.staff_tasks for all using(public.is_staff()) with check(public.is_staff());
drop policy if exists leave_staff on public.leave_requests;
create policy leave_staff on public.leave_requests for all using(public.is_staff()) with check(public.is_staff());

insert into public.feature_flags(key, enabled) values
('visitors', true),
('maintenance', true),
('inventory', true),
('expenses', true),
('attendance', true),
('staff_tasks', true),
('leave_requests', true)
on conflict(key) do nothing;
