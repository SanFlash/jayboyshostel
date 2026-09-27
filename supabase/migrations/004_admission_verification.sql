-- Admission verification fields and private government-ID proof storage.
-- Apply after 001_initial_schema.sql. Government-ID images remain in a private Storage bucket.

alter table public.applications add column if not exists govt_id_type text;
alter table public.applications add column if not exists govt_id_number text;
alter table public.applications add column if not exists parent_phone text;
alter table public.applications add column if not exists govt_id_verified boolean not null default false;
alter table public.applications add column if not exists govt_id_verified_at timestamptz;
alter table public.applications add column if not exists govt_id_verified_by uuid references auth.users(id) on delete set null;
alter table public.applications add column if not exists govt_id_proof_path text;
alter table public.applications add column if not exists govt_id_proof_filename text;
alter table public.applications add column if not exists govt_id_proof_mime_type text;
alter table public.applications add column if not exists govt_id_proof_size_bytes bigint;
alter table public.applications add column if not exists verification_note text;

create index if not exists applications_govt_id_number_idx on public.applications(govt_id_number);
create index if not exists applications_parent_phone_idx on public.applications(parent_phone);
create index if not exists applications_govt_id_verified_idx on public.applications(govt_id_verified);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resident-government-id', 'resident-government-id', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
