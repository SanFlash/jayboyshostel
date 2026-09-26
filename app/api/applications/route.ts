import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
function adminClient(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Supabase server configuration is missing.");return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}})}
export async function POST(request:Request){
 try{
  const body=await request.json() as Record<string,unknown>;
  const required=["full_name","phone","email"];for(const key of required){if(typeof body[key]!=="string"||!(body[key] as string).trim())return NextResponse.json({error:key+" is required."},{status:400})}
  const supabase=adminClient();const code="JBS-"+new Date().getFullYear()+"-"+crypto.randomUUID().slice(0,8).toUpperCase();
  const {data:member,error:memberError}=await supabase.from("members").insert({full_name:String(body.full_name).trim(),father_name:String(body.father_name||"").trim()||null,mother_name:String(body.mother_name||"").trim()||null,phone:String(body.phone).trim(),email:String(body.email).trim().toLowerCase(),institution:String(body.institution||"").trim()||null,course:String(body.course||"").trim()||null,academic_year:String(body.academic_year||"").trim()||null,address:String(body.address||"").trim()||null,city:String(body.city||"").trim()||null,state:String(body.state||"").trim()||null,postal_code:String(body.postal_code||"").trim()||null,status:"active"}).select("id").single();
  if(memberError)throw memberError;
  const {error:appError}=await supabase.from("applications").insert({application_code:code,member_id:member.id,status:"submitted",submitted_at:new Date().toISOString()});
  if(appError)throw appError;
  return NextResponse.json({ok:true,application_code:code});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Application failed."},{status:500})}
}