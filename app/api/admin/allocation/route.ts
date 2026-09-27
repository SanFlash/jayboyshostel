import { NextResponse } from "next/server";
import { getAdminContext, adminServiceClient } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

function fail(message:string,status=400){return NextResponse.json({ok:false,error:message},{status});}

export async function POST(request:Request){
  const auth=await getAdminContext();
  if(!auth)return fail("Unauthorized",401);
  let body:any; try{body=await request.json()}catch{return fail("Invalid JSON.")}

  const memberId=String(body.member_id||"");
  const bedId=String(body.bed_id||"");
  const checkIn=String(body.check_in_date||new Date().toISOString().slice(0,10));
  if(!memberId||!bedId)return fail("Resident and bed are required.");

  const db=adminServiceClient();
  const {data:bed,error:bedError}=await db.from("beds").select("id,room_id,status,rooms(id,monthly_rate,security_deposit,status)").eq("id",bedId).maybeSingle();
  if(bedError||!bed)return fail("Bed not found.",404);
  if(bed.status==="maintenance"||bed.status==="blocked")return fail("This bed is not available for allocation.");
  if(bed.status==="occupied"||bed.status==="reserved")return fail("This bed is already allocated.");

  const {data:member}=await db.from("members").select("id,full_name,status").eq("id",memberId).maybeSingle();
  if(!member)return fail("Resident not found.",404);

  const {data:existing}=await db.from("tenancies").select("id").eq("member_id",memberId).in("status",["active","notice_period","checkout_pending"]).maybeSingle();
  if(existing)return fail("This resident already has an active room allocation.");

  const room=Array.isArray(bed.rooms)?bed.rooms[0]:bed.rooms;
  if(!room)return fail("Room not found.",404);

  const {data:tenancy,error:tenancyError}=await db.from("tenancies").insert({
    member_id:memberId,room_id:bed.room_id,bed_id:bed.id,
    check_in_date:checkIn, billing_start_date:checkIn,
    expected_checkout_date:body.expected_checkout_date||null,
    rent_amount:body.rent_amount ?? room.monthly_rate ?? 0,
    security_deposit:body.security_deposit ?? room.security_deposit ?? 0,
    status:"active",notes:body.notes||"Allocated from Floor Occupancy.",
  }).select().single();
  if(tenancyError)return fail(tenancyError.message);

  const {error:bedUpdate}=await db.from("beds").update({status:"occupied"}).eq("id",bed.id);
  if(bedUpdate){
    await db.from("tenancies").delete().eq("id",tenancy.id);
    return fail(bedUpdate.message,500);
  }

  await syncRoom(db,bed.room_id);
  await db.from("audit_logs").insert({
    actor_id:auth.user.id,action:"allocate",entity_type:"tenancies",entity_id:tenancy.id,
    new_data:{member_id:memberId,room_id:bed.room_id,bed_id:bed.id},
    reason:"Resident allocated from floor occupancy.",
  });

  return NextResponse.json({ok:true,data:tenancy});
}

export async function DELETE(request:Request){
  const auth=await getAdminContext();
  if(!auth)return fail("Unauthorized",401);
  let body:any; try{body=await request.json()}catch{return fail("Invalid JSON.")}
  const bedId=String(body.bed_id||"");
  if(!bedId)return fail("Bed is required.");

  const db=adminServiceClient();
  const {data:tenancy,error}=await db.from("tenancies").select("id,room_id,member_id").eq("bed_id",bedId).in("status",["active","notice_period","checkout_pending"]).maybeSingle();
  if(error||!tenancy)return fail("Active allocation not found.",404);

  const checkoutDate=String(body.check_out_date||new Date().toISOString().slice(0,10));
  const {error:updateError}=await db.from("tenancies").update({status:"checked_out",check_out_date:checkoutDate}).eq("id",tenancy.id);
  if(updateError)return fail(updateError.message,500);
  const {error:bedError}=await db.from("beds").update({status:"available"}).eq("id",bedId);
  if(bedError)return fail(bedError.message,500);
  await syncRoom(db,tenancy.room_id);
  await db.from("audit_logs").insert({
    actor_id:auth.user.id,action:"checkout",entity_type:"tenancies",entity_id:tenancy.id,
    new_data:{bed_id:bedId,member_id:tenancy.member_id,check_out_date:checkoutDate},
    reason:"Resident released from floor occupancy.",
  });
  return NextResponse.json({ok:true});
}

async function syncRoom(db:ReturnType<typeof adminServiceClient>,roomId:string){
  const {data:room}=await db.from("rooms").select("id,capacity,status").eq("id",roomId).maybeSingle();
  if(!room)return;
  const {count}=await db.from("beds").select("id",{count:"exact",head:true}).eq("room_id",roomId).eq("status","occupied");
  const occupied=count||0;
  const next=occupied===0 ? "available" : occupied>=room.capacity ? "full" : "partially_occupied";
  if(room.status!=="maintenance"&&room.status!=="reserved"&&room.status!=="inactive"){
    await db.from("rooms").update({status:next}).eq("id",roomId);
  }
}
