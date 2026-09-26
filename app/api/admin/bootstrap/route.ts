import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const enabled = process.env.ADMIN_BOOTSTRAP_ENABLED === "true";
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const supplied = request.headers.get("x-admin-bootstrap-secret");
  if (!enabled || !secret || supplied !== secret) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!email || !password || !supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Admin bootstrap environment is incomplete." }, { status: 500 });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const { data: existing, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    const found = existing.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

    let userId: string;
    if (found) {
      userId = found.id;
      const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true, user_metadata: { role: "admin" } });
      if (error) throw error;
    } else {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: "admin" } });
      if (error || !data.user) throw error ?? new Error("Unable to create admin user.");
      userId = data.user.id;
    }

    const { error: profileError } = await admin.from("profiles").upsert({ id: userId, full_name: "Jay Boys Hostel Admin", email, is_active: true });
    if (profileError) throw profileError;
    const { error: roleError } = await admin.from("user_roles").upsert({ user_id: userId, role: "super_admin" });
    if (roleError) throw roleError;

    return NextResponse.json({ ok: true, message: "Admin account is ready.", email, user_id: userId });
  } catch (error) {
    console.error("Admin bootstrap failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin bootstrap failed." }, { status: 500 });
  }
}
