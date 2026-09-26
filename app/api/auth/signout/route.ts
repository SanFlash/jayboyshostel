import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/admin-session";

export async function GET(request: Request) {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
