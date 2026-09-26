import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase/server";

const TABLES = new Set([
  "profiles","user_roles","hostels","buildings","floors","rooms","beds","members",
  "member_guardians","applications","application_status_history","document_types",
  "documents","tenancies","pricing_plans","invoices","invoice_items","payments",
  "announcements","notifications","complaints","complaint_comments","audit_logs",
  "settings","feature_flags",
]);

const SERVICE_TABLES = new Set(["user_roles","profiles","audit_logs"]);

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Server Supabase configuration is incomplete.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function authorize() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const allowed = roles?.some((r) => ["super_admin", "admin", "manager", "staff", "accountant"].includes(r.role));
  return allowed ? { user, role: roles?.find((r) => r.role === "super_admin")?.role ?? "staff" } : null;
}

export async function GET(request: Request) {
  const auth = await authorize();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const table = url.searchParams.get("table") || "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 250);
  if (!TABLES.has(table)) return NextResponse.json({ error: "Unsupported table." }, { status: 400 });

  const db = serviceClient();
  const { data, error } = await db.from(table).select("*").limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  return mutate(request, "insert");
}

export async function PATCH(request: Request) {
  return mutate(request, "update");
}

export async function DELETE(request: Request) {
  return mutate(request, "delete");
}

async function mutate(request: Request, action: "insert" | "update" | "delete") {
  const auth = await authorize();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { table?: string; id?: string; data?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const table = body.table || "";
  if (!TABLES.has(table)) return NextResponse.json({ error: "Unsupported table." }, { status: 400 });

  if (action !== "insert" && !body.id) {
    return NextResponse.json({ error: "A record id is required." }, { status: 400 });
  }

  // Only super admins can change roles, audit history, or system configuration.
  if (SERVICE_TABLES.has(table) && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can modify this resource." }, { status: 403 });
  }

  const db = serviceClient();
  try {
    let result: { data: any; error: any };

    if (action === "insert") {
      result = await db.from(table).insert(body.data ?? {}).select().single();
    } else if (action === "update") {
      result = await db.from(table).update(body.data ?? {}).eq("id", body.id).select().single();
    } else {
      result = await db.from(table).delete().eq("id", body.id).select().single();
    }

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });

    if (table !== "audit_logs") {
      await db.from("audit_logs").insert({
        actor_id: auth.user.id,
        action,
        entity_type: table,
        entity_id: result.data?.id ?? body.id ?? null,
        new_data: action === "delete" ? null : result.data,
        reason: "Admin console mutation",
      });
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mutation failed." },
      { status: 500 },
    );
  }
}
