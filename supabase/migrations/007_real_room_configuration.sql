-- Jay Boys Hostel: authoritative real room configuration.
-- Source: owner-provided room/capacity/cost sheet.
-- This migration removes synthetic demo residents/operations, normalizes the
-- property to ONE building, and seeds only the supplied room inventory.
-- Cost is stored as monthly_rate because that is the project's room-rate field.
-- Daily rate and security deposit are intentionally left unset because they
-- were not supplied.

do $$
declare
  h uuid;
  main_building uuid;
  floor0 uuid; floor1 uuid; floor2 uuid; floor3 uuid; floor4 uuid;
  protected_count integer;
begin
  select id into h from public.hostels order by created_at limit 1;
  if h is null then
    raise exception 'Jay Boys Hostel must exist before applying migration 007.';
  end if;

  -- Remove synthetic demo operational records first.
  delete from public.payments p where p.payment_number like 'PAY-DEMO-%';
  delete from public.invoice_items ii where ii.invoice_id in (
    select id from public.invoices where invoice_number like 'INV-DEMO-%'
  );
  delete from public.invoices where invoice_number like 'INV-DEMO-%';
  delete from public.complaint_comments cc where cc.complaint_id in (
    select c.id from public.complaints c join public.members m on m.id=c.member_id
    where m.member_code like 'JBY-DEMO-%'
  );
  delete from public.complaints c using public.members m
    where c.member_id=m.id and m.member_code like 'JBY-DEMO-%';
  delete from public.application_status_history ash where ash.application_id in (
    select a.id from public.applications a where a.application_code like 'APP-DEMO-%'
  );
  delete from public.applications where application_code like 'APP-DEMO-%';
  delete from public.documents d using public.members m
    where d.member_id=m.id and m.member_code like 'JBY-DEMO-%';
  delete from public.member_guardians g using public.members m
    where g.member_id=m.id and m.member_code like 'JBY-DEMO-%';
  delete from public.visitors v using public.members m
    where v.member_id=m.id and m.member_code like 'JBY-DEMO-%';
  delete from public.attendance a using public.members m
    where a.member_id=m.id and m.member_code like 'JBY-DEMO-%';
  delete from public.leave_requests l using public.members m
    where l.member_id=m.id and m.member_code like 'JBY-DEMO-%';
  delete from public.tenancies t using public.members m
    where t.member_id=m.id and m.member_code like 'JBY-DEMO-%';
  delete from public.members where member_code like 'JBY-DEMO-%';

  delete from public.expenses where reference like 'EXP-DEMO-%' or notes ilike '%demo%';
  delete from public.inventory_items where notes ilike '%demo%';
  delete from public.maintenance_requests where title='Ceiling fan inspection';
  delete from public.staff_tasks where title in ('Verify pending admissions','Inspect maintenance queue','Prepare monthly finance review');
  delete from public.announcements where title in ('Monthly rent reminder','Water tank maintenance','Independence Day gathering');

  -- Protect real resident allocations before restructuring the room tree.
  select count(*) into protected_count
  from public.tenancies t
  join public.rooms r on r.id=t.room_id
  where r.floor_id in (select f.id from public.floors f join public.buildings b on b.id=f.building_id where b.hostel_id=h);

  if protected_count > 0 then
    raise exception 'Migration 007 stopped: % real tenancy record(s) exist. Review real allocations before rebuilding the room structure.', protected_count;
  end if;

  select count(*) into protected_count
  from public.complaints c
  join public.rooms r on r.id=c.room_id
  where r.floor_id in (select f.id from public.floors f join public.buildings b on b.id=f.building_id where b.hostel_id=h);
  if protected_count > 0 then
    raise exception 'Migration 007 stopped: real complaints reference current rooms. Resolve or reassign them before rebuilding room structure.';
  end if;

  select count(*) into protected_count
  from public.maintenance_requests mr
  join public.rooms r on r.id=mr.room_id
  join public.floors f on f.id=r.floor_id
  join public.buildings b on b.id=f.building_id
  where b.hostel_id=h;
  if protected_count > 0 then
    raise exception 'Migration 007 stopped: real maintenance records reference current rooms. Resolve or reassign them before rebuilding room structure.';
  end if;

  -- The hostel has exactly one building.
  delete from public.beds where room_id in (
    select r.id from public.rooms r
    join public.floors f on f.id=r.floor_id
    join public.buildings b on b.id=f.building_id
    where b.hostel_id=h
  );
  delete from public.rooms where floor_id in (
    select f.id from public.floors f
    join public.buildings b on b.id=f.building_id
    where b.hostel_id=h
  );
  delete from public.floors where building_id in (
    select id from public.buildings where hostel_id=h
  );
  delete from public.buildings where hostel_id=h;

  insert into public.buildings(hostel_id,name,sort_order)
  values(h,'Main Building',1)
  returning id into main_building;

  insert into public.floors(building_id,name,sort_order)
  values
    (main_building,'Floor 0',0),
    (main_building,'Floor 1',1),
    (main_building,'Floor 2',2),
    (main_building,'Floor 3',3),
    (main_building,'Floor 4',4);

  select id into floor0 from public.floors where building_id=main_building and sort_order=0;
  select id into floor1 from public.floors where building_id=main_building and sort_order=1;
  select id into floor2 from public.floors where building_id=main_building and sort_order=2;
  select id into floor3 from public.floors where building_id=main_building and sort_order=3;
  select id into floor4 from public.floors where building_id=main_building and sort_order=4;

  insert into public.rooms(floor_id,room_number,room_type,capacity,monthly_rate,daily_rate,security_deposit,status,notes)
  values
    (floor0,'0-1','4 Sharing',4,5000,null,0,'available','Owner-provided room sheet'),
    (floor1,'F1-0','2 Sharing',2,7500,null,0,'available','Owner-provided room sheet'),
    (floor1,'F1-1','1 Sharing',1,8500,null,0,'available','Owner-provided room sheet'),
    (floor1,'F1-2','2 Sharing',2,7500,null,0,'available','Owner-provided room sheet'),
    (floor1,'F1-3','3 Sharing',3,7000,null,0,'available','Owner-provided room sheet'),
    (floor2,'F2-4','2 Sharing',2,7500,null,0,'available','Owner-provided room sheet'),
    (floor2,'F2-5','1 Sharing',1,8500,null,0,'available','Owner-provided room sheet'),
    (floor2,'F2-6','2 Sharing',2,7500,null,0,'available','Owner-provided room sheet'),
    (floor2,'F2-7','3 Sharing',3,7000,null,0,'available','Owner-provided room sheet'),
    (floor3,'F3-8','2 Sharing',2,7500,null,0,'available','Owner-provided room sheet'),
    (floor3,'F3-9','1 Sharing',1,8500,null,0,'available','Owner-provided room sheet'),
    (floor3,'F3-10','2 Sharing',2,7500,null,0,'available','Owner-provided room sheet'),
    (floor3,'F3-11','3 Sharing',3,7000,null,0,'available','Owner-provided room sheet'),
    (floor4,'F4-12','3 Sharing',3,7000,null,0,'available','Owner-provided room sheet');

  -- Generate exactly the supplied number of beds per room.
  insert into public.beds(room_id,bed_label,status)
  select r.id, 'B' || gs::text, 'available'::public.bed_status
  from public.rooms r
  cross join lateral generate_series(1,r.capacity) gs;

  -- Replace all room-rate plans with the authoritative owner-provided bands.
  delete from public.pricing_plans
  where hostel_id=h
    and name in ('1 Sharing','2 Sharing','3 Sharing','4 Sharing','Premium 2 Sharing','Standard 3 Sharing','Economy 4 Sharing');

  insert into public.pricing_plans(hostel_id,name,room_type,monthly_rate,daily_rate,billing_method,active)
  values
    (h,'1 Sharing','1 Sharing',8500,null,'fixed_30_days',true),
    (h,'2 Sharing','2 Sharing',7500,null,'fixed_30_days',true),
    (h,'3 Sharing','3 Sharing',7000,null,'fixed_30_days',true),
    (h,'4 Sharing','4 Sharing',5000,null,'fixed_30_days',true);

  -- Remove demo-only homepage status messaging without touching owner content.
  delete from public.site_content where key='demo_status';

  -- Do not publish synthetic contact credentials as real hostel information.
  update public.hostels
  set phone=nullif(phone,'+91 731 400 2200'),
      email=nullif(email,'admin@jayboyshostel.in')
  where id=h;
end $$;

-- Helpful integrity indexes for the single-building inventory.
create unique index if not exists one_building_per_hostel
  on public.buildings(hostel_id);
