import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import AdminModule from "./AdminModule";

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!roles?.some((r) => ["super_admin", "admin", "manager", "staff", "accountant"].includes(r.role))) redirect("/member");
  return <AdminModule module={module} />;
}
