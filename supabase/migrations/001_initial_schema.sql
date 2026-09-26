create extension if not exists pgcrypto;
create type public.app_role as enum ('super_admin','admin','manager','staff','accountant','member');
create type public.application_status as enum ('draft','submitted','under_review','documents_required','approved','rejected','waitlisted','cancelled');
create type public.bed_status as enum ('available','reserved','occupied','maintenance','blocked');
create type public.room_status as enum ('available','partially_occupied','full','maintenance','reserved','inactive');
create type public.tenancy_status as enum ('active','notice_period','checkout_pending','checked_out','archived');
create type public.invoice_status as enum ('draft','issued','partially_paid','paid','overdue','cancelled');
create type public.complaint_status as enum ('submitted','acknowledged','assigned','in_progress','waiting','resolved','closed','reopened');
create type public.priority_level as enum ('normal','important','urgent');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, email text, phone text, avatar_url text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.user_roles (user_id uuid references public.profiles(id) on delete cascade, role public.app_role not null, primary key(user_id,role));
create table public.hostels (id uuid primary key default gen_random_uuid(), name text not null, address text, city text, state text, postal_code text, phone text, email text, logo_url text, latitude numeric, longitude numeric, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.buildings (id uuid primary key default gen_random_uuid(), hostel_id uuid not null references public.hostels(id) on delete cascade, name text not null, sort_order int not null default 0, created_at timestamptz not null default now());
create table public.floors (id uuid primary key default gen_random_uuid(), building_id uuid not null references public.buildings(id) on delete cascade, name text not null, sort_order int not null default 0, created_at timestamptz not null default now());
create table public.rooms (id uuid primary key default gen_random_uuid(), floor_id uuid not null references public.floors(id) on delete cascade, room_number text not null, room_type text not null default '4 Sharing', capacity int not null check(capacity>0), monthly_rate numeric(12,2) not null default 0, daily_rate numeric(12,2), security_deposit numeric(12,2) not null default 0, status public.room_status not null default 'available', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(floor_id,room_number));
create table public.beds (id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade, bed_label text not null, status public.bed_status not null default 'available', created_at timestamptz not null default now(), unique(room_id,bed_label));
create table public.members (id uuid primary key default gen_random_uuid(), user_id uuid unique references auth.users(id) on delete set null, member_code text unique, full_name text not null, father_name text, mother_name text, dob date, gender text, phone text, alternate_phone text, email text, id_type text, id_number_masked text, address text, city text, state text, postal_code text, institution text, course text, academic_year text, enrollment_number text, status public.tenancy_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.member_guardians (id uuid primary key default gen_random_uuid(), member_id uuid not null references public.members(id) on delete cascade, name text not null, relationship text, phone text, alternate_phone text, address text, created_at timestamptz not null default now());
create table public.applications (id uuid primary key default gen_random_uuid(), application_code text unique not null, member_id uuid references public.members(id) on delete set null, status public.application_status not null default 'draft', submitted_at timestamptz, reviewed_at timestamptz, reviewed_by uuid references auth.users(id), admin_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.application_status_history (id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete cascade, status public.application_status not null, note text, changed_by uuid references auth.users(id), created_at timestamptz not null default now());
create table public.document_types (id uuid primary key default gen_random_uuid(), hostel_id uuid not null references public.hostels(id) on delete cascade, name text not null, required_for_application boolean not null default true, active boolean not null default true, created_at timestamptz not null default now());
create table public.documents (id uuid primary key default gen_random_uuid(), member_id uuid not null references public.members(id) on delete cascade, document_type_id uuid references public.document_types(id) on delete set null, storage_path text not null, original_filename text not null, mime_type text, size_bytes bigint, status text not null default 'uploaded', verification_note text, verified_by uuid references auth.users(id), verified_at timestamptz, created_at timestamptz not null default now());
create table public.tenancies (id uuid primary key default gen_random_uuid(), member_id uuid not null references public.members(id) on delete cascade, room_id uuid not null references public.rooms(id), bed_id uuid not null references public.beds(id), check_in_date date not null, expected_checkout_date date, check_out_date date, billing_start_date date not null, rent_amount numeric(12,2) not null default 0, security_deposit numeric(12,2) not null default 0, status public.tenancy_status not null default 'active', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index active_bed_tenancy on public.tenancies(bed_id) where status in('active','notice_period','checkout_pending');
create unique index active_member_tenancy on public.tenancies(member_id) where status in('active','notice_period','checkout_pending');
create table public.pricing_plans (id uuid primary key default gen_random_uuid(), hostel_id uuid not null references public.hostels(id) on delete cascade, name text not null, room_type text, monthly_rate numeric(12,2) not null default 0, daily_rate numeric(12,2), billing_method text not null default 'fixed_30_days', active boolean not null default true, created_at timestamptz not null default now());
create table public.invoices (id uuid primary key default gen_random_uuid(), invoice_number text unique not null, member_id uuid not null references public.members(id), tenancy_id uuid references public.tenancies(id), period_start date not null, period_end date not null, issue_date date not null default current_date, due_date date not null, subtotal numeric(12,2) not null default 0, discount numeric(12,2) not null default 0, late_fee numeric(12,2) not null default 0, total numeric(12,2) not null default 0, paid_amount numeric(12,2) not null default 0, status public.invoice_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.invoice_items (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id) on delete cascade, description text not null, quantity numeric(12,2) not null default 1, unit_price numeric(12,2) not null default 0, total numeric(12,2) not null default 0);
create table public.payments (id uuid primary key default gen_random_uuid(), payment_number text unique not null, member_id uuid not null references public.members(id), invoice_id uuid references public.invoices(id), amount numeric(12,2) not null check(amount>0), payment_date timestamptz not null default now(), method text not null, transaction_id text, notes text, created_by uuid references auth.users(id), created_at timestamptz not null default now());
create table public.announcements (id uuid primary key default gen_random_uuid(), hostel_id uuid not null references public.hostels(id) on delete cascade, title text not null, message text not null, priority public.priority_level not null default 'normal', audience text not null default 'all_members', publish_at timestamptz not null default now(), expires_at timestamptz, created_by uuid references auth.users(id), created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, title text not null, body text not null, type text not null, read_at timestamptz, scheduled_for timestamptz, sent_at timestamptz, dedupe_key text unique, created_at timestamptz not null default now());
create table public.complaints (id uuid primary key default gen_random_uuid(), member_id uuid not null references public.members(id) on delete cascade, room_id uuid references public.rooms(id), title text not null, description text not null, category text not null default 'Other', priority public.priority_level not null default 'normal', status public.complaint_status not null default 'submitted', assigned_to uuid references auth.users(id), resolution text, resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.complaint_comments (id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints(id) on delete cascade, author_id uuid references auth.users(id), body text not null, internal boolean not null default false, created_at timestamptz not null default now());
create table public.audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id), action text not null, entity_type text not null, entity_id uuid, old_data jsonb, new_data jsonb, reason text, created_at timestamptz not null default now());
create table public.settings (key text primary key, value jsonb not null, updated_by uuid references auth.users(id), updated_at timestamptz not null default now());
create table public.feature_flags (key text primary key, enabled boolean not null default true, updated_by uuid references auth.users(id), updated_at timestamptz not null default now());

create index members_phone_idx on public.members(phone);
create index applications_status_idx on public.applications(status);
create index invoices_due_date_idx on public.invoices(due_date);
create index complaints_status_idx on public.complaints(status);
create index notifications_user_unread_idx on public.notifications(user_id,read_at);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
create or replace function public.has_role(requested_role public.app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role=requested_role); $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role in('super_admin','admin','manager','staff','accountant')); $$;

do $$
declare t text;
begin
foreach t in array array['profiles','hostels','rooms','members','applications','tenancies','invoices','complaints'] loop
execute format('drop trigger if exists %I_updated_at on public.%I',t,t);
execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t);
end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.hostels enable row level security;
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.rooms enable row level security;
alter table public.beds enable row level security;
alter table public.members enable row level security;
alter table public.member_guardians enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.documents enable row level security;
alter table public.tenancies enable row level security;
alter table public.pricing_plans enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_comments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings enable row level security;
alter table public.feature_flags enable row level security;

create policy profiles_read on public.profiles for select using(id=auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update using(id=auth.uid() or public.is_staff());
create policy roles_read on public.user_roles for select using(user_id=auth.uid() or public.is_staff());
create policy hostel_public_read on public.hostels for select using(true);
create policy room_public_read on public.rooms for select using(true);
create policy bed_public_read on public.beds for select using(true);
create policy members_read on public.members for select using(public.is_staff() or user_id=auth.uid());
create policy members_insert on public.members for insert with check(public.is_staff() or user_id=auth.uid());
create policy members_update on public.members for update using(public.is_staff() or user_id=auth.uid());
create policy guardians_read on public.member_guardians for select using(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy applications_read on public.applications for select using(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy applications_insert on public.applications for insert with check(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy applications_update_staff on public.applications for update using(public.is_staff());
create policy documents_read on public.documents for select using(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy documents_insert on public.documents for insert with check(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy tenancy_read on public.tenancies for select using(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy invoices_read on public.invoices for select using(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy invoice_items_read on public.invoice_items for select using(public.is_staff());
create policy payments_read on public.payments for select using(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy announcements_read on public.announcements for select using(true);
create policy notifications_read on public.notifications for select using(user_id=auth.uid() or public.is_staff());
create policy notifications_update on public.notifications for update using(user_id=auth.uid() or public.is_staff());
create policy complaints_read on public.complaints for select using(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy complaints_insert on public.complaints for insert with check(public.is_staff() or exists(select 1 from public.members m where m.id=member_id and m.user_id=auth.uid()));
create policy complaints_update on public.complaints for update using(public.is_staff());
create policy complaint_comments_read on public.complaint_comments for select using(public.is_staff() or exists(select 1 from public.complaints c join public.members m on m.id=c.member_id where c.id=complaint_id and m.user_id=auth.uid() and internal=false));
create policy audit_read on public.audit_logs for select using(public.is_staff());
create policy settings_read on public.settings for select using(public.is_staff());
create policy settings_write on public.settings for all using(public.has_role('super_admin')) with check(public.has_role('super_admin'));
create policy flags_read on public.feature_flags for select using(public.is_staff());
create policy flags_write on public.feature_flags for all using(public.has_role('super_admin')) with check(public.has_role('super_admin'));

insert into public.feature_flags(key,enabled) values
('member_management',true),('room_management',true),('billing',true),('payments',true),('documents',true),('complaints',true),('announcements',true),
('visitor_management',false),('mess_management',false),('inventory',false),('electricity_billing',false) on conflict(key) do nothing;