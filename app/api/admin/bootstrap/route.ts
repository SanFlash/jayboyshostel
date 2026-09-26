import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSession } from "@/lib/auth/admin-session";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = (process.env.ADMIN_EMAIL || "jayboys@gmail.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey || !adminPassword) {
    return NextResponse.json({ error: "Admin login is not configured on the server." }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: existing, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) throw listError;

    const found = existing.users.find(
      (user) => user.email?.toLowerCase() === adminEmail,
    );

    let userId: string;

    if (found) {
      userId = found.id;
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: "admin" },
      });
      if (error) throw error;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: "admin" },
      });
      if (error || !data.user) throw error ?? new Error("Unable to create admin user.");
      userId = data.user.id;
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      full_name: "Jay Boys Hostel Admin",
      email: adminEmail,
      is_active: true,
    });
    if (profileError) throw profileError;

    const { error: roleError } = await admin.from("user_roles").upsert({
      user_id: userId,
      role: "super_admin",
    });
    if (roleError) throw roleError;

    const response = NextResponse.json({
      ok: true,
      provisioned: true,
      role: "super_admin",
      redirect: "/admin",
    });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: createAdminSession(userId, adminEmail),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Admin provisioning failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin provisioning failed." },
      { status: 500 },
    );
  }
}
