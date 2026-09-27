import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAdminContext();
  if (!auth) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const db = adminServiceClient();
  const { data, error } = await db
    .from("buildings")
    .select("id,name,sort_order,hostel_id,floors(id,name,sort_order,rooms(id,room_number,room_type,capacity,status,beds(id,bed_label,status,tenancies(id,status,check_in_date,expected_checkout_date,members(id,member_code,full_name,phone,photo_path,photo_url))))))")
    .order("sort_order",{ascending:true})
    .order("name",{ascending:true});

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });

  const signed = new Map<string,string>();
  const getPhoto = async (path?: string|null) => {
    if (!path) return null;
    if (signed.has(path)) return signed.get(path)!;
    const { data: urlData } = await db.storage.from("resident-photos").createSignedUrl(path, 900);
    const url = urlData?.signedUrl || null;
    if (url) signed.set(path,url);
    return url;
  };

  const buildings = await Promise.all((data || []).map(async (building:any) => ({
    id:building.id,name:building.name,sort_order:building.sort_order,
    floors:await Promise.all((building.floors || []).sort((a:any,b:any)=>a.sort_order-b.sort_order).map(async (floor:any) => ({
      id:floor.id,name:floor.name,sort_order:floor.sort_order,
      rooms:await Promise.all((floor.rooms || []).sort((a:any,b:any)=>String(a.room_number).localeCompare(String(b.room_number),undefined,{numeric:true})).map(async (room:any) => ({
        id:room.id,room_number:room.room_number,room_type:room.room_type,capacity:room.capacity,status:room.status,
        beds:await Promise.all((room.beds || []).map(async (bed:any) => {
          const active=(bed.tenancies || []).find((t:any)=>["active","notice_period","checkout_pending"].includes(t.status));
          const member=active?.members || null;
          return {...bed,tenancies:undefined,resident:member?{...member,photo_url:await getPhoto(member.photo_path) || member.photo_url || null}:null,tenancy:active?{id:active.id,status:active.status,check_in_date:active.check_in_date,expected_checkout_date:active.expected_checkout_date}:null};
        }))
      })))
    })))
  })));

  return NextResponse.json({ ok:true, buildings, generatedAt:new Date().toISOString() });
}
