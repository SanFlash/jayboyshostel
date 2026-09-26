export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, BedDouble, Building2, FileText, IndianRupee, LifeBuoy, LogOut, ShieldCheck } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
export default async function MemberPage(){
 const supabase=await createSupabaseServer();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const [{data:profile},{data:member},{data:notifications}]=await Promise.all([
  supabase.from("profiles").select("full_name,email").eq("id",user.id).maybeSingle(),
  supabase.from("members").select("id,member_code,full_name,status").eq("user_id",user.id).maybeSingle(),
  supabase.from("notifications").select("id,title,body,read_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(5)
 ]);
 let tenancy:any=null;if(member){const res=await supabase.from("tenancies").select("check_in_date,expected_checkout_date,rent_amount,rooms(room_number,room_type),beds(bed_label)").eq("member_id",member.id).in("status",["active","notice_period","checkout_pending"]).maybeSingle();tenancy=res.data}
 return <main className="dashboard-page"><header className="dash-top"><Link href="/" className="brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>RESIDENT PORTAL</small></span></Link><Link href="/api/auth/signout" className="icon-button"><LogOut size={16}/></Link></header><div className="dash-wrap"><div className="dash-heading"><span className="eyebrow"><ShieldCheck size={14}/> PRIVATE RESIDENT AREA</span><h1>Welcome{profile?.full_name ? ", "+profile.full_name.split(" ")[0] : ""}.</h1><p>{profile?.email||user.email}</p></div>
 {!member?<div className="setup-card"><ShieldCheck/><h2>Your resident profile is not linked yet.</h2><p>Your Supabase account is active, but staff still need to create or link the resident record.</p><Link href="/apply" className="button primary">View admission flow</Link></div>:
 <><section className="data-grid"><article className="data-card accent"><span>MEMBER CODE</span><b>{member.member_code||"Pending"}</b><small>{member.status}</small></article><article className="data-card"><BedDouble/><span>ROOM</span><b>{tenancy?.rooms?.room_number||"Not allocated"}</b><small>{tenancy?.beds?.bed_label?"Bed "+tenancy.beds.bed_label:"Awaiting allocation"}</small></article><article className="data-card"><IndianRupee/><span>MONTHLY RENT</span><b>{tenancy?.rent_amount?"₹"+Number(tenancy.rent_amount).toLocaleString("en-IN"):"—"}</b><small>Active tenancy</small></article><article className="data-card"><Bell/><span>NOTIFICATIONS</span><b>{notifications?.filter(n=>!n.read_at).length||0}</b><small>Unread</small></article></section>
 <section className="dash-columns"><div className="panel"><div className="panel-head"><div><span>MY STAY</span><h2>Accommodation</h2></div><BedDouble/></div>{tenancy?<div className="detail-list"><p><b>Room</b><span>{tenancy.rooms?.room_number||"—"}</span></p><p><b>Type</b><span>{tenancy.rooms?.room_type||"—"}</span></p><p><b>Bed</b><span>{tenancy.beds?.bed_label||"—"}</span></p><p><b>Check-in</b><span>{tenancy.check_in_date}</span></p></div>:<div className="empty-state">No active tenancy has been allocated to this account yet.</div>}</div>
 <div className="panel"><div className="panel-head"><div><span>RECENT</span><h2>Notifications</h2></div><Bell/></div>{notifications?.length?<div className="notification-list">{notifications.map(n=><div key={n.id}><b>{n.title}</b><p>{n.body}</p></div>)}</div>:<div className="empty-state">No notifications yet.</div>}</div></section></>}
 <div className="quick-links"><Link href="/member/documents"><FileText/> Documents</Link><Link href="/member/complaints"><LifeBuoy/> Support</Link><Link href="/"><Building2/> Public site</Link></div></div></main>
}