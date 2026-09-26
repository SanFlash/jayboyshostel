insert into public.hostels(name,address,city,state,postal_code) values ('Jay Boys Hostel','71, Vinoba Nagar Rd','Indore','Madhya Pradesh','452018') on conflict do nothing;
insert into public.settings(key,value) values
('billing','{"currency":"INR","billing_method":"fixed_30_days","reminders":[7,3,1,0,-1],"default_late_fee":0}'),
('admission','{"required_documents":["Identity proof","Address proof","Passport photo","Student ID"]}'),
('general','{"hero_title":"A Safe, Comfortable and Connected Place to Stay."}') on conflict(key) do update set value=excluded.value;