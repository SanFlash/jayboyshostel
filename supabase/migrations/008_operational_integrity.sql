-- Jay Boys Hostel operational integrity hardening.
-- Keeps bed, room and tenancy state synchronized even when records are edited
-- outside the Floor Occupancy workflow.

create or replace function public.validate_tenancy_allocation()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  actual_room uuid;
begin
  select room_id into actual_room from public.beds where id=new.bed_id;
  if actual_room is null then
    raise exception 'Selected bed does not exist.';
  end if;
  if actual_room <> new.room_id then
    raise exception 'Selected bed does not belong to the selected room.';
  end if;
  if new.expected_checkout_date is not null and new.expected_checkout_date < new.check_in_date then
    raise exception 'Expected checkout cannot be before check-in.';
  end if;
  if new.billing_start_date < new.check_in_date then
    raise exception 'Billing start cannot be before check-in.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_tenancy_allocation_trigger on public.tenancies;
create trigger validate_tenancy_allocation_trigger
before insert or update of room_id,bed_id,check_in_date,expected_checkout_date,billing_start_date
on public.tenancies
for each row execute function public.validate_tenancy_allocation();

create or replace function public.sync_room_from_tenancy()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  old_room uuid;
  new_room uuid;
  old_bed uuid;
  new_bed uuid;
  old_member uuid;
  new_member uuid;
  occupied_count integer;
  room_capacity integer;
  room_to_sync uuid;
begin
  if tg_op='INSERT' then
    new_room:=new.room_id;
    new_bed:=new.bed_id;
    new_member:=new.member_id;
    update public.beds set status=case when new.status in ('active','notice_period','checkout_pending') then 'occupied'::public.bed_status else 'available'::public.bed_status end where id=new_bed;
  elsif tg_op='DELETE' then
    old_room:=old.room_id;
    old_bed:=old.bed_id;
    old_member:=old.member_id;
    update public.beds set status='available'::public.bed_status where id=old_bed;
  else
    old_room:=old.room_id;
    new_room:=new.room_id;
    old_bed:=old.bed_id;
    new_bed:=new.bed_id;
    old_member:=old.member_id;
    new_member:=new.member_id;

    if old_bed is distinct from new_bed then
      update public.beds set status='available'::public.bed_status where id=old_bed;
    end if;

    update public.beds
    set status=case when new.status in ('active','notice_period','checkout_pending') then 'occupied'::public.bed_status else 'available'::public.bed_status end
    where id=new_bed;
  end if;

  foreach room_to_sync in array pg_catalog.array_remove(array[old_room,new_room],null) loop
    select capacity into room_capacity from public.rooms where id=room_to_sync;
    if room_capacity is null then continue; end if;

    select count(*) into occupied_count
    from public.beds
    where room_id=room_to_sync and status='occupied';

    update public.rooms
    set status=case
      when status in ('maintenance','reserved','inactive') then status
      when occupied_count=0 then 'available'::public.room_status
      when occupied_count>=room_capacity then 'full'::public.room_status
      else 'partially_occupied'::public.room_status
    end
    where id=room_to_sync;
  end loop;

  if tg_op='INSERT' then
    update public.members
    set status=case when new.status='notice_period' then 'notice_period'::public.tenancy_status else 'active'::public.tenancy_status end
    where id=new_member and new.status in ('active','notice_period','checkout_pending');
  elsif tg_op='UPDATE' then
    if new.status in ('active','notice_period','checkout_pending') then
      update public.members
      set status=case when new.status='notice_period' then 'notice_period'::public.tenancy_status else 'active'::public.tenancy_status end
      where id=new_member;
    elsif old.status in ('active','notice_period','checkout_pending') then
      if not exists(select 1 from public.tenancies where member_id=old_member and id<>new.id and status in ('active','notice_period','checkout_pending')) then
        update public.members set status='checked_out'::public.tenancy_status where id=old_member and status<>'archived';
      end if;
    end if;
  else
    if not exists(select 1 from public.tenancies where member_id=old_member and status in ('active','notice_period','checkout_pending')) then
      update public.members set status='checked_out'::public.tenancy_status where id=old_member and status<>'archived';
    end if;
  end if;

  return coalesce(new,old);
end;
$$;

drop trigger if exists sync_room_from_tenancy_trigger on public.tenancies;
create trigger sync_room_from_tenancy_trigger
after insert or update of room_id,bed_id,status,member_id or delete
on public.tenancies
for each row execute function public.sync_room_from_tenancy();

create or replace function public.validate_bed_capacity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  cap integer;
  bed_count integer;
begin
  if tg_op='INSERT' then
    select capacity into cap from public.rooms where id=new.room_id;
    select count(*) into bed_count from public.beds where room_id=new.room_id;
    if cap is not null and bed_count >= cap then
      raise exception 'Room % already has its full bed capacity.', new.room_id;
    end if;
  elsif tg_op='UPDATE' and new.room_id <> old.room_id then
    select capacity into cap from public.rooms where id=new.room_id;
    select count(*) into bed_count from public.beds where room_id=new.room_id and id<>old.id;
    if cap is not null and bed_count >= cap then
      raise exception 'Target room already has its full bed capacity.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_bed_capacity_trigger on public.beds;
create trigger validate_bed_capacity_trigger
before insert or update of room_id
on public.beds
for each row execute function public.validate_bed_capacity();

create or replace function public.validate_room_capacity()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  bed_count integer;
begin
  select count(*) into bed_count from public.beds where room_id=new.id;
  if new.capacity < bed_count then
    raise exception 'Room capacity cannot be lower than its existing bed count (%).', bed_count;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_room_capacity_trigger on public.rooms;
create trigger validate_room_capacity_trigger
before update of capacity on public.rooms
for each row execute function public.validate_room_capacity();

-- Convenient reporting surface for admin dashboards and exports.
create or replace view public.current_room_allocations as
select
  t.id as tenancy_id,
  t.member_id,
  m.member_code,
  m.full_name,
  m.phone,
  m.photo_path,
  r.id as room_id,
  r.room_number,
  r.room_type,
  r.monthly_rate,
  f.id as floor_id,
  f.name as floor_name,
  b.id as building_id,
  b.name as building_name,
  bed.id as bed_id,
  bed.bed_label,
  t.check_in_date,
  t.expected_checkout_date,
  t.status
from public.tenancies t
join public.members m on m.id=t.member_id
join public.rooms r on r.id=t.room_id
join public.floors f on f.id=r.floor_id
join public.buildings b on b.id=f.building_id
join public.beds bed on bed.id=t.bed_id
where t.status in ('active','notice_period','checkout_pending');
