# Supabase Setup

1. Create a Supabase project.
2. Run supabase/migrations/001_initial_schema.sql.
3. Run supabase/seed.sql for development.
4. Create private Storage buckets described in supabase/storage-policies.md.
5. Configure Auth redirect URLs for localhost and production.
6. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
7. Keep SUPABASE_SERVICE_ROLE_KEY server-side only.
8. Review final RLS policies before production use.
