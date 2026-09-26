import { requireAdmin } from "@/lib/auth/admin";
import AdminModule from "./AdminModule";

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  await requireAdmin();
  return <AdminModule module={module} />;
}
