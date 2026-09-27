import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg","image/png","image/webp"]);

export async function POST(request: Request) {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const form = await request.formData();
  const file = form.get("file");
  const memberId = String(form.get("member_id") || "");
  if (!(file instanceof File)) return NextResponse.json({ ok:false, error:"Photo file is required." }, { status:400 });
  if (!memberId) return NextResponse.json({ ok:false, error:"Member ID is required." }, { status:400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ ok:false, error:"Only JPG, PNG or WEBP images are allowed." }, { status:400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ ok:false, error:"Resident photo must be 5 MB or smaller." }, { status:400 });

  const db = adminServiceClient();
  const { data: member, error: memberError } = await db.from("members").select("id,photo_path").eq("id",memberId).maybeSingle();
  if (memberError || !member) return NextResponse.json({ ok:false, error:"Resident record was not found." }, { status:404 });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `members/${memberId}/profile-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const upload = await db.storage.from("resident-photos").upload(path, bytes, {
    contentType:file.type,
    upsert:false,
    cacheControl:"3600",
  });
  if (upload.error) return NextResponse.json({ ok:false, error:upload.error.message }, { status:500 });

  const { error: updateError } = await db.from("members").update({
    photo_path:path,
    photo_filename:file.name,
    photo_mime_type:file.type,
    photo_size_bytes:file.size,
    photo_uploaded_at:new Date().toISOString(),
  }).eq("id",memberId);

  if (updateError) {
    await db.storage.from("resident-photos").remove([path]);
    return NextResponse.json({ ok:false, error:updateError.message }, { status:500 });
  }

  if (member.photo_path && member.photo_path !== path) {
    await db.storage.from("resident-photos").remove([member.photo_path]);
  }

  return NextResponse.json({ ok:true, path, filename:file.name, mimeType:file.type, size:file.size });
}
