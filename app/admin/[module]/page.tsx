import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ArrowLeft, BedDouble, Building2, ClipboardList, FileText, IndianRupee, MessageSquareWarning } from "lucide-react";

export default async function AdminModule({params}:{params:Promise<{module:string}>}){
 const {module}=await params;const supabase=await createSupabaseServer();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:roles}=await supabase.from("user_roles").select("role").eq("user_id",user.id);if(!roles?.some(r=>["super_admin","admin","manager","staff","accountant"].includes(r.role)))redirect("/member");
 const config:Record<string,{title:string;desc:string;icon:typeof BedDouble}>={
  applications:{title:"Applications",desc:"Admission records awaiting review.",icon:ClipboardList},
  rooms:{title:"Rooms & beds",desc:"Accommodation inventory and allocation records.",icon:BedDouble},
  billing:{title:"Billing",desc:"Invoice and payment records.",icon:IndianRupee},
  complaints:{title:"Complaints",desc:"Resident support and resolution queue.",icon:MessageSquareWarning}
 };
 const item=config[module]||{title:"Operations",desc:"This module is not configured yet.",icon:FileText};const Icon=item.icon;
 let rows:any[]=[];
 if(module==="applications"){const q=await supabase.from("applications").select("id,application_code,status,created_at").order("created_at",{ascending:false}).limit(30);rows=q.data||[]}
 if(module==="rooms"){const q=await supabase.from("rooms").select("id,room_number,room_type,capacity,status,monthly_rate").order("room_number").limit(50);rows=q.data||[]}
 if(module==="billing"){const q=await supabase.from("invoices").select("id,invoice_number,status,total,due_date").order("due_date",{ascending:false}).limit(30);rows=q.data||[]}
 if(module==="complaints"){const q=await supabase.from("complaints").select("id,title,category,priority,status,created_at").order("created_at",{ascending:false}).limit(30);rows=q.data||[]}
 return <main className="dashboard-page"><header className="dash-top"><Link href="/admin" className="brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>OPERATIONS</small></span></Link><Link href="/admin" className="icon-button"><ArrowLeft size={16}/></Link></header><div className="dash-wrap"><div className="dash-heading"><span className="eyebrow"><Icon size={14}/> DATA MODULE</span><h1>{item.title}</h1><p>{item.desc}</p></div><div className="panel" style={{marginTop:30}}>{rows.length?<div className="table-list">{rows.map(row=><div key={row.id}><span><b>{row.application_code||row.room_number||row.invoice_number||row.title}</b><small>{row.status||row.room_type||row.category||""}</small></span><span>{row.total!=null?"₹"+Number(row.total).toLocaleString("en-IN"):row.created_at?new Date(row.created_at).toLocaleDateString("en-IN"):""}</span></div>)}</div>:<div className="empty-state">No records are currently available in this module. Create or import records in Supabase, then refresh this page.</div>}</div></div></main>
}