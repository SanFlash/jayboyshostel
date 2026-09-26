# Architecture

Admissions → Verification → Allocation → Tenancy → Billing → Payments → Notifications → Complaints → Checkout.

Supabase/PostgreSQL is the source of truth. Critical billing, authorization and allocation logic must execute server-side/database-side. RLS is defense in depth. Financial history is archived rather than deleted. Active bed/member tenancy is protected by partial unique indexes. Reminder jobs use dedupe keys and must be idempotent.

Future modules: visitor management, attendance, mess, laundry, inventory, electricity billing, staff operations, online gateways, digital agreements and multi-hostel support.
