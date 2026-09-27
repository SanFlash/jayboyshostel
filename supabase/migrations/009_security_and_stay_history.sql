-- Jay Boys Hostel security + stay-history extensions.
-- Keeps visitor identity information and resident room-change history available
-- without creating extra primary admin modules.

alter table public.visitors
  add column if not exists id_type text,
  add column if not exists id_number_masked text,
  add column if not exists photo_path text,
  add column if not exists photo_filename text,
  add column if not exists photo_mime_type text,
  add column if not exists photo_size_bytes bigint;

create index if not exists visitors_member_idx on public.visitors(member_id);
create index if not exists visitors_id_number_idx on public.visitors(id_number_masked);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values(
  'visitor-photos','visitor-photos',false,3145728,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict(id) do update set
  public=false,
  file_size_limit=3145728,
  allowed_mime_types=array['image/jpeg','image/png','image/webp']::text[];

create table if not exists public.room_change_history(
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  tenancy_id uuid references public.tenancies(id) on delete set null,
  old_room_id uuid references public.rooms(id) on delete set null,
  old_bed_id uuid references public.beds(id) on delete set null,
  new_room_id uuid references public.rooms(id) on delete set null,
  new_bed_id uuid references public.beds(id) on delete set null,
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists room_change_member_idx on public.room_change_history(member_id,changed_at desc);
alter table public.room_change_history enable row level security;
drop policy if exists room_change_staff on public.room_change_history;
create policy room_change_staff on public.room_change_history for all using(public.is_staff()) with check(public.is_staff());

create or replace function public.log_room_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op='UPDATE' and (old.room_id is distinct from new.room_id or old.bed_id is distinct from new.bed_id) then
    insert into public.room_change_history(
      member_id,tenancy_id,old_room_id,old_bed_id,new_room_id,new_bed_id,reason,changed_by
    )
    values(
      new.member_id,new.id,old.room_id,old.bed_id,new.room_id,new.bed_id,new.notes,
      null
    );
  end if;
  return new;
end;
$$;

drop trigger if exists log_room_change_trigger on public.tenancies;
create trigger log_room_change_trigger
after update of room_id,bed_id on public.tenancies
for each row execute function public.log_room_change();
