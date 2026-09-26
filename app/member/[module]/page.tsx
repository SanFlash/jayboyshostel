import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ArrowLeft, Building2, FileText, LifeBuoy } from "lucide-react";
export default async function MemberModule({params}:{params:Promise<{module:string}>}){
 const {module}=await params;const supabase=await createSupabaseServer();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const title=module==="documents"?"Documents":"Support";const Icon=module==="documents"?FileText:LifeBuoy;
 const {data:member}=await supabase.from("members").select("id").eq("user_id",user.id).maybeSingle();let rows:any[]=[];
 if(member&&module==="documents"){const q=await supabase.from("documents").select("id,original_filename,status,created_at").eq("member_id",member.id).order("created_at",{ascending:false});rows=q.data||[]}
 if(member&&module==="complaints"){const q=await supabase.from("complaints").select("id,title,status,priority,created_at").eq("member_id",member.id).order("created_at",{ascending:false});rows=q.data||[]}
 return <main className="dashboard-page"><header className="dash-top"><Link href="/member" className="brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>RESIDENT PORTAL</small></span></Link><Link href="/member" className="icon-button"><ArrowLeft size={16}/></Link></header><div className="dash-wrap"><div className="dash-heading"><span className="eyebrow"><Icon size={14}/> RESIDENT AREA</span><h1>{title}</h1><p>Your records are loaded according to your authenticated account and RLS policies.</p></div><div className="panel" style={{marginTop:30}}>{rows.length?<div className="table-list">{rows.map(row=><div key={row.id}><span><b>{row.original_filename||row.title}</b><small>{row.status||row.priority}</small></span><span>{new Date(row.created_at).toLocaleDateString("en-IN")}</span></div>)}</div>:<div className="empty-state">No {title.toLowerCase()} records are available for this account yet.</div>}</div></div></main>
}