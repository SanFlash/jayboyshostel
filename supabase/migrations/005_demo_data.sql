-- Production-style demo dataset for Jay Boys Hostel.
-- Apply after migrations 001-004. All rows are ordinary editable records.
-- Safe to re-run: records are keyed by recognizable demo codes/names.

do $$
declare
  h uuid;
  b1 uuid; b2 uuid; b3 uuid;
  f1 uuid; f2 uuid; f3 uuid; f4 uuid; f5 uuid;
  r uuid; m uuid; app uuid; ten uuid; inv uuid;
  i int;
begin
  select id into h from public.hostels order by created_at limit 1;
  if h is null then
    insert into public.hostels(name,address,city,state,postal_code,phone,email)
    values('Jay Boys Hostel','Vinoba Nagar','Indore','Madhya Pradesh','452001','+91 731 400 2200','admin@jayboyshostel.in')
    returning id into h;
  else
    update public.hostels set phone=coalesce(nullif(phone,''),'+91 731 400 2200'), email=coalesce(nullif(email,''),'admin@jayboyshostel.in') where id=h;
  end if;

  insert into public.buildings(hostel_id,name,sort_order)
  values (h,'Main Building',1),(h,'Annex Building',2),(h,'Executive Wing',3)
  on conflict do nothing;

  select id into b1 from public.buildings where hostel_id=h and name='Main Building';
  select id into b2 from public.buildings where hostel_id=h and name='Annex Building';
  select id into b3 from public.buildings where hostel_id=h and name='Executive Wing';

  insert into public.floors(building_id,name,sort_order)
  values (b1,'Ground Floor',1),(b1,'First Floor',2),(b1,'Second Floor',3),(b2,'Ground Floor',1),(b2,'First Floor',2)
  on conflict do nothing;

  select id into f1 from public.floors where building_id=b1 and name='Ground Floor';
  select id into f2 from public.floors where building_id=b1 and name='First Floor';
  select id into f3 from public.floors where building_id=b1 and name='Second Floor';
  select id into f4 from public.floors where building_id=b2 and name='Ground Floor';
  select id into f5 from public.floors where building_id=b2 and name='First Floor';

  for i in 1..6 loop
    insert into public.rooms(floor_id,room_number,room_type,capacity,monthly_rate,daily_rate,security_deposit,status)
    values(f1,'G'||lpad(i::text,2,'0'),'4 Sharing',4,6500,217,6500,case when i=6 then 'partially_occupied'::public.room_status else 'full'::public.room_status end)
    on conflict(floor_id,room_number) do nothing;
  end loop;
  for i in 1..6 loop
    insert into public.rooms(floor_id,room_number,room_type,capacity,monthly_rate,daily_rate,security_deposit,status)
    values(f2,'1'||lpad(i::text,2,'0'),'3 Sharing',3,7000,234,7000,case when i in(5,6) then 'partially_occupied'::public.room_status else 'full'::public.room_status end)
    on conflict(floor_id,room_number) do nothing;
  end loop;
  for i in 1..6 loop
    insert into public.rooms(floor_id,room_number,room_type,capacity,monthly_rate,daily_rate,security_deposit,status)
    values(f3,'2'||lpad(i::text,2,'0'),'2 Sharing',2,8000,267,8000,case when i in(4,5,6) then 'partially_occupied'::public.room_status else 'full'::public.room_status end)
    on conflict(floor_id,room_number) do nothing;
  end loop;
  for i in 1..6 loop
    insert into public.rooms(floor_id,room_number,room_type,capacity,monthly_rate,daily_rate,security_deposit,status)
    values(f4,'A'||lpad(i::text,2,'0'),'4 Sharing',4,6200,207,6200,case when i in(1,2) then 'partially_occupied'::public.room_status else 'available'::public.room_status end)
    on conflict(floor_id,room_number) do nothing;
  end loop;
  for i in 1..6 loop
    insert into public.rooms(floor_id,room_number,room_type,capacity,monthly_rate,daily_rate,security_deposit,status)
    values(f5,'B'||lpad(i::text,2,'0'),'2 Sharing',2,8200,274,8200,case when i=6 then 'maintenance'::public.room_status else 'available'::public.room_status end)
    on conflict(floor_id,room_number) do nothing;
  end loop;

  for r in select id from public.rooms where floor_id in(f1,f2,f3,f4,f5) loop
    insert into public.beds(room_id,bed_label,status)
    select r.id,'B'||x,case when x=1 and r.id in(select id from public.rooms where status='full') then 'occupied'::public.bed_status else 'available'::public.bed_status end
    from generate_series(1,4) x
    where x <= (select capacity from public.rooms where id=r.id)
    on conflict(room_id,bed_label) do nothing;
  end loop;

  insert into public.members(member_code,full_name,father_name,mother_name,dob,gender,phone,alternate_phone,email,id_type,id_number_masked,address,city,state,postal_code,institution,course,academic_year,enrollment_number,status)
  values
  ('JBY-DEMO-001','Aarav Sharma','Rajesh Sharma','Sunita Sharma','2004-02-14','Male','+91 90000 10001','+91 90000 20001','aarav.demo@example.com','aadhaar','XXXX-XXXX-1001','Vijay Nagar','Indore','Madhya Pradesh','452010','IPS Academy','BCA','2025-26','IPS-BCA-25001','active'),
  ('JBY-DEMO-002','Vivaan Patel','Mahesh Patel','Kiran Patel','2003-08-21','Male','+91 90000 10002','+91 90000 20002','vivaan.demo@example.com','aadhaar','XXXX-XXXX-1002','Palasia','Indore','Madhya Pradesh','452001','Medicaps University','B.Tech CSE','2025-26','MED-CSE-25022','active'),
  ('JBY-DEMO-003','Aditya Verma','Sanjay Verma','Neelam Verma','2004-11-03','Male','+91 90000 10003','+91 90000 20003','aditya.demo@example.com','aadhaar','XXXX-XXXX-1003','Rau','Indore','Madhya Pradesh','453331','SVVV','B.Tech IT','2024-25','SVVV-IT-24041','active'),
  ('JBY-DEMO-004','Rohan Gupta','Anil Gupta','Meena Gupta','2002-06-17','Male','+91 90000 10004','+91 90000 20004','rohan.demo@example.com','aadhaar','XXXX-XXXX-1004','Bhawarkuan','Indore','Madhya Pradesh','452001','DAVV','MBA','2025-26','DAVV-MBA-25009','active'),
  ('JBY-DEMO-005','Kabir Khan','Imran Khan','Farida Khan','2005-01-28','Male','+91 90000 10005','+91 90000 20005','kabir.demo@example.com','aadhaar','XXXX-XXXX-1005','Scheme 54','Indore','Madhya Pradesh','452010','Acropolis Institute','BCA','2025-26','ACI-BCA-25018','active'),
  ('JBY-DEMO-006','Arjun Mehta','Deepak Mehta','Ritu Mehta','2003-04-12','Male','+91 90000 10006','+91 90000 20006','arjun.demo@example.com','aadhaar','XXXX-XXXX-1006','Geeta Bhawan','Indore','Madhya Pradesh','452014','IPS Academy','MCA','2025-26','IPS-MCA-25007','active'),
  ('JBY-DEMO-007','Ishaan Joshi','Manoj Joshi','Pooja Joshi','2004-09-30','Male','+91 90000 10007','+91 90000 20007','ishaan.demo@example.com','aadhaar','XXXX-XXXX-1007','Bengali Square','Indore','Madhya Pradesh','452016','SVVV','BBA','2025-26','SVVV-BBA-25013','active'),
  ('JBY-DEMO-008','Reyansh Singh','Vikram Singh','Anita Singh','2003-12-09','Male','+91 90000 10008','+91 90000 20008','reyansh.demo@example.com','aadhaar','XXXX-XXXX-1008','Rau','Indore','Madhya Pradesh','453331','Medicaps University','B.Tech ME','2024-25','MED-ME-24028','notice_period'),
  ('JBY-DEMO-009','Atharv Nair','Suresh Nair','Latha Nair','2005-03-19','Male','+91 90000 10009','+91 90000 20009','atharv.demo@example.com','aadhaar','XXXX-XXXX-1009','Vijay Nagar','Indore','Madhya Pradesh','452010','IPS Academy','BCA','2025-26','IPS-BCA-25033','active'),
  ('JBY-DEMO-010','Dhruv Jain','Rajiv Jain','Kavita Jain','2002-10-25','Male','+91 90000 10010','+91 90000 20010','dhruv.demo@example.com','aadhaar','XXXX-XXXX-1010','Palasia','Indore','Madhya Pradesh','452001','DAVV','M.Tech','2025-26','DAVV-MT-25003','active'),
  ('JBY-DEMO-011','Yash Malhotra','Amit Malhotra','Renu Malhotra','2004-05-06','Male','+91 90000 10011','+91 90000 20011','yash.demo@example.com','aadhaar','XXXX-XXXX-1011','Sudama Nagar','Indore','Madhya Pradesh','452009','Acropolis Institute','BCA','2025-26','ACI-BCA-25031','active'),
  ('JBY-DEMO-012','Manav Soni','Rakesh Soni','Rekha Soni','2003-07-15','Male','+91 90000 10012','+91 90000 20012','manav.demo@example.com','aadhaar','XXXX-XXXX-1012','Rau','Indore','Madhya Pradesh','453331','SVVV','B.Tech CSE','2024-25','SVVV-CSE-24055','active'),
  ('JBY-DEMO-013','Dev Thakur','Pradeep Thakur','Shalini Thakur','2005-02-11','Male','+91 90000 10013','+91 90000 20013','dev.demo@example.com','passport','P-DEMO-0013','Dewas Naka','Indore','Madhya Pradesh','452010','Medicaps University','B.Tech CSE','2025-26','MED-CSE-25045','active'),
  ('JBY-DEMO-014','Kunal Yadav','Ramesh Yadav','Sarla Yadav','2002-03-08','Male','+91 90000 10014','+91 90000 20014','kunal.demo@example.com','aadhaar','XXXX-XXXX-1014','Bicholi','Indore','Madhya Pradesh','452016','DAVV','MCA','2025-26','DAVV-MCA-25011','active'),
  ('JBY-DEMO-015','Harsh Tiwari','Ashok Tiwari','Madhuri Tiwari','2004-08-18','Male','+91 90000 10015','+91 90000 20015','harsh.demo@example.com','aadhaar','XXXX-XXXX-1015','LIG Colony','Indore','Madhya Pradesh','452008','IPS Academy','BBA','2025-26','IPS-BBA-25044','active'),
  ('JBY-DEMO-016','Samar Roy','Subhash Roy','Mamata Roy','2003-09-22','Male','+91 90000 10016','+91 90000 20016','samar.demo@example.com','aadhaar','XXXX-XXXX-1016','Rau','Indore','Madhya Pradesh','453331','SVVV','B.Tech IT','2024-25','SVVV-IT-24077','active'),
  ('JBY-DEMO-017','Nikhil Dubey','Alok Dubey','Rashmi Dubey','2005-06-27','Male','+91 90000 10017','+91 90000 20017','nikhil.demo@example.com','aadhaar','XXXX-XXXX-1017','Vijay Nagar','Indore','Madhya Pradesh','452010','Acropolis Institute','BCA','2025-26','ACI-BCA-25059','active'),
  ('JBY-DEMO-018','Ayaan Khan','Salim Khan','Nazia Khan','2004-01-31','Male','+91 90000 10018','+91 90000 20018','ayaan.demo@example.com','aadhaar','XXXX-XXXX-1018','Palasia','Indore','Madhya Pradesh','452001','DAVV','B.Com','2025-26','DAVV-BCOM-25016','active')
  on conflict(member_code) do nothing;

  insert into public.member_guardians(member_id,name,relationship,phone,alternate_phone,address)
  select id, split_part(full_name,' ',1)||' Guardian','Father', '+91 91000 '||lpad((10000+row_number() over(order by member_code))::text,5,'0'), phone, address||', '||city
  from public.members where member_code like 'JBY-DEMO-%'
  and not exists(select 1 from public.member_guardians g where g.member_id=members.id);

  insert into public.applications(application_code,member_id,status,govt_id_type,govt_id_number,parent_phone,govt_id_verified,submitted_at,reviewed_at,verification_note,admin_note)
  select 'APP-DEMO-'||lpad(row_number() over(order by member_code)::text,3,'0'),id,
    case when row_number() over(order by member_code) <= 14 then 'approved'::public.application_status
         when row_number() over(order by member_code) <= 16 then 'under_review'::public.application_status
         when row_number() over(order by member_code) = 17 then 'documents_required'::public.application_status
         else 'submitted'::public.application_status end,
    id_type, id_number_masked, alternate_phone,
    row_number() over(order by member_code) <= 15,
    current_date - ((row_number() over(order by member_code))::int || ' days')::interval,
    case when row_number() over(order by member_code) <= 14 then current_date - ((row_number() over(order by member_code)+2)::int || ' days')::interval end,
    case when row_number() over(order by member_code) <= 15 then 'Demo verification completed.' else 'Demo application awaiting review.' end,
    'Production demo record — safe to edit or delete.'
  from public.members
  where member_code like 'JBY-DEMO-%'
  on conflict(application_code) do nothing;

  for m in select id from public.members where member_code like 'JBY-DEMO-%' loop
    select t.id into ten from public.tenancies t where t.member_id=m and t.status in('active','notice_period','checkout_pending') limit 1;
    if ten is null then
      select r.id, r.floor_id into r, f1 from public.rooms r where r.status in('full','partially_occupied') order by random() limit 1;
      insert into public.beds(room_id,bed_label,status)
      select r.id,'DEMO-'||right(m::text,4),'occupied' where not exists(select 1 from public.beds where room_id=r and bed_label='DEMO-'||right(m::text,4));
      select id into inv from public.beds where room_id=r and bed_label='DEMO-'||right(m::text,4);
      insert into public.tenancies(member_id,room_id,bed_id,check_in_date,expected_checkout_date,billing_start_date,rent_amount,security_deposit,status,notes)
      values(m,r,inv,current_date-((1+floor(random()*180))::int),current_date+180,current_date-((1+floor(random()*180))::int),(select monthly_rate from public.rooms where id=r),(select security_deposit from public.rooms where id=r),'active','Production demo tenancy — editable.');
    end if;
  end loop;

  insert into public.pricing_plans(hostel_id,name,room_type,monthly_rate,daily_rate,billing_method,active)
  values(h,'Premium 2 Sharing','2 Sharing',8000,267,'fixed_30_days',true),(h,'Standard 3 Sharing','3 Sharing',7000,234,'fixed_30_days',true),(h,'Economy 4 Sharing','4 Sharing',6200,207,'fixed_30_days',true)
  on conflict do nothing;

  insert into public.document_types(hostel_id,name,required_for_application,active)
  values(h,'Aadhaar / Government ID',true,true),(h,'Passport Photo',true,true),(h,'College ID',true,true),(h,'Parent ID / Contact Proof',false,true),(h,'Medical Fitness Certificate',false,true)
  on conflict do nothing;

  insert into public.invoices(invoice_number,member_id,tenancy_id,period_start,period_end,issue_date,due_date,subtotal,discount,late_fee,total,paid_amount,status)
  select 'INV-DEMO-'||lpad(row_number() over(order by m.member_code)::text,3,'0'),m.id,t.id,date_trunc('month',current_date)::date,(date_trunc('month',current_date)+interval '1 month-1 day')::date,current_date-5,current_date+5,6500,case when row_number() over(order by m.member_code)%5=0 then 500 else 0 end,0,case when row_number() over(order by m.member_code)%5=0 then 6000 else 6500 end,case when row_number() over(order by m.member_code)%3=0 then 6500 else 0 end,case when row_number() over(order by m.member_code)%3=0 then 'paid'::public.invoice_status else 'issued'::public.invoice_status end
  from public.members m join public.tenancies t on t.member_id=m.id
  where m.member_code like 'JBY-DEMO-%'
  on conflict(invoice_number) do nothing;

  insert into public.payments(payment_number,member_id,invoice_id,amount,payment_date,method,transaction_id,notes)
  select 'PAY-DEMO-'||lpad(row_number() over(order by i.invoice_number)::text,3,'0'),i.member_id,i.id,i.paid_amount,current_date-2,'UPI','DEMO-TXN-'||right(i.id::text,8),'Demo payment — editable.'
  from public.invoices i where i.invoice_number like 'INV-DEMO-%' and i.paid_amount>0
  on conflict(payment_number) do nothing;

  insert into public.announcements(hostel_id,title,message,priority,publish_at,expires_at)
  values
  (h,'Monthly rent reminder','Monthly rent is due by the 5th. Please complete payment from the resident desk.','important',now(),now()+interval '30 days'),
  (h,'Water tank maintenance','Water supply may be interrupted between 11:00 AM and 1:00 PM tomorrow.','normal',now(),now()+interval '3 days'),
  (h,'Independence Day gathering','Residents are invited to the common area for the hostel celebration.','normal',now(),now()+interval '10 days')
  on conflict do nothing;

  insert into public.complaints(member_id,room_id,title,description,category,priority,status)
  select m.id,t.room_id,'Wi-Fi speed issue','Internet is slower than usual during evening hours.','Internet','important'::public.priority_level,
    case when row_number() over(order by m.member_code)%3=0 then 'in_progress'::public.complaint_status else 'submitted'::public.complaint_status end
  from public.members m join public.tenancies t on t.member_id=m.id
  where m.member_code in('JBY-DEMO-001','JBY-DEMO-004','JBY-DEMO-009','JBY-DEMO-013')
  on conflict do nothing;

  insert into public.visitors(member_id,visitor_name,phone,relationship,purpose,visit_date,check_in,check_out,status,notes)
  select m.id,'Demo Visitor '||left(m.full_name,5),'+91 92000 10001','Parent','Resident visit',current_date,
    now()-interval '2 hours',now()-interval '1 hour','checked_out','Demo visitor record.'
  from public.members m where m.member_code in('JBY-DEMO-001','JBY-DEMO-006','JBY-DEMO-011')
  and not exists(select 1 from public.visitors v where v.member_id=m.id and v.visit_date=current_date);

  insert into public.maintenance_requests(room_id,title,description,priority,status,resolution)
  select r.id,'Ceiling fan inspection','Fan making unusual noise; inspect and service.','normal'::public.priority_level,'open',''
  from public.rooms r where r.room_number in('G02','102','A02')
  and not exists(select 1 from public.maintenance_requests x where x.room_id=r.id and x.title='Ceiling fan inspection');

  insert into public.inventory_items(hostel_id,name,category,sku,quantity,unit,reorder_level,location,status,notes)
  values
  (h,'LED Bulb 12W','Electrical','ELEC-BULB-12',38,'pcs',10,'Store Room','active','Demo stock'),
  (h,'Ceiling Fan','Electrical','ELEC-FAN-01',6,'pcs',2,'Store Room','active','Demo stock'),
  (h,'Mattress','Room Supplies','ROOM-MAT-01',14,'pcs',4,'Ground Store','active','Demo stock'),
  (h,'Pillow','Room Supplies','ROOM-PIL-01',32,'pcs',8,'Ground Store','active','Demo stock'),
  (h,'Cleaning Liquid','Housekeeping','HK-LIQ-01',18,'bottles',5,'Housekeeping Store','active','Demo stock'),
  (h,'Bedsheet','Housekeeping','HK-BED-01',44,'pcs',12,'Laundry Store','active','Demo stock')
  on conflict do nothing;

  insert into public.expenses(hostel_id,category,description,amount,expense_date,vendor,payment_method,reference,notes)
  values
  (h,'Utilities','Electricity bill - demo cycle',18450,current_date-8,'MPPKVVCL','bank','EXP-DEMO-001','Demo expense'),
  (h,'Maintenance','Plumbing supplies',3250,current_date-5,'Indore Hardware','cash','EXP-DEMO-002','Demo expense'),
  (h,'Housekeeping','Monthly cleaning supplies',6100,current_date-3,'CleanPro Indore','UPI','EXP-DEMO-003','Demo expense'),
  (h,'Internet','Fiber internet monthly plan',2999,current_date-2,'DemoNet','UPI','EXP-DEMO-004','Demo expense')
  on conflict do nothing;

  insert into public.attendance(member_id,attendance_date,status,note)
  select m.id,current_date-1,case when row_number() over(order by m.member_code)%7=0 then 'late' else 'present' end,'Demo attendance'
  from public.members m where m.member_code like 'JBY-DEMO-%'
  on conflict(member_id,attendance_date) do nothing;

  insert into public.staff_tasks(title,description,priority,status,due_date)
  values
  ('Verify pending admissions','Review government ID and admission documents for pending applicants.','urgent'::public.priority_level,'open',current_date+1),
  ('Inspect maintenance queue','Review open room maintenance requests and assign technicians.','important'::public.priority_level,'in_progress',current_date+2),
  ('Prepare monthly billing','Generate invoices and reconcile outstanding payments.','important'::public.priority_level,'open',current_date+3),
  ('Inventory audit','Count store room supplies and update quantities.','normal'::public.priority_level,'open',current_date+7)
  on conflict do nothing;

  insert into public.leave_requests(member_id,start_date,end_date,reason,status)
  select id,current_date+2,current_date+5,'Family visit — demo request','pending'
  from public.members where member_code in('JBY-DEMO-003','JBY-DEMO-010')
  and not exists(select 1 from public.leave_requests l where l.member_id=members.id and l.start_date=current_date+2);

  insert into public.site_content(key,section,title,subtitle,body,cta_label,cta_href,value,active)
  values
  ('demo_status','home','Live demo workspace','ADMIN CONSOLE','This environment contains realistic sample residents, rooms, beds, admissions, billing, visitors, maintenance, inventory and staff operations. Every demo record can be edited or deleted from the admin console.','','','{}',true)
  on conflict(key) do update set body=excluded.body,active=true;
end $$;
