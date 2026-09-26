create table if not exists public.site_content (
  key text primary key,
  section text not null default 'general',
  title text,
  subtitle text,
  body text,
  cta_label text,
  cta_href text,
  value jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content
  for select using (active = true);

insert into public.site_content(key,section,title,subtitle,body,cta_label,cta_href)
values
('hero','home','Stay simple. Live connected.','DIGITAL HOSTEL PLATFORM','Jay Boys Hostel brings admissions, accommodation, resident records, billing, documents and support into one focused experience for Vinoba Nagar, Indore.','Start admission','/apply'),
('experience','home','One system for the stay.','01 / PLATFORM','Designed as a product, not a collection of disconnected screens.','',''),
('facilities','home','Built around what residents actually need.','02 / DAILY LIFE','Mobile-first resident experience, real operational records and connected support.','',''),
('admission','home','From application to check-in.','03 / ADMISSION','Apply, verify, allocate and move in through one connected workflow.','',''),
('cta','home','A better hostel workflow starts here.','JAY BOYS HOSTEL · VINOBA NAGAR','','','/apply')
on conflict(key) do nothing;

create index if not exists site_content_section_idx on public.site_content(section);
