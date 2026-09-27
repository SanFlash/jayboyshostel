-- Resident photos + floor occupancy reporting
alter table public.members
  add column if not exists photo_path text,
  add column if not exists photo_filename text,
  add column if not exists photo_mime_type text,
  add column if not exists photo_size_bytes bigint,
  add column if not exists photo_uploaded_at timestamptz;

create index if not exists members_photo_path_idx on public.members(photo_path);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resident-photos',
  'resident-photos',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update set
  public=false,
  file_size_limit=5242880,
  allowed_mime_types=array['image/jpeg','image/png','image/webp']::text[];
