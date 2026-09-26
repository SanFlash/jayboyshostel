import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { Activity, ArrowLeft, CalendarDays, ClipboardList, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CalendarPage(){
  const {db}=await requireAdmin();
  const [leaves,tasks,visitors,maintenance]=await Promise.all([
    db.from("leave_requests").select("id,start_date,end_date,status,reason").order("start_date",{ascending:true}).limit(50),
    db.from("staff_tasks").select("id,title,due_date,status,priority").order("due_date",{ascending:true}).limit(50),
    db.from("visitors").select("id,visitor_name,visit_date,status,purpose").order("visit_date",{ascending:true}).limit(50),
    db.from("maintenance_requests").select("id,title,status,priority,created_at").order("created_at",{ascending:false}).limit(50)
  ]);
  const events=[
    ...(leaves.data||[]).map(x=>({date:x.start_date,title:"Leave request",detail:x.reason,status:x.status})),
    ...(tasks.data||[]).filter(x=>x.due_date).map(x=>({date:x.due_date,title:x.title,detail:"Staff task · "+x.priority,status:x.status})),
    ...(visitors.data||[]).map(x=>({date:x.visit_date,title:x.visitor_name,detail:x.purpose||"Visitor",status:x.status})),
    ...(maintenance.data||[]).map(x=>({date:x.created_at.slice(0,10),title:x.title,detail:"Maintenance",status:x.status}))
  ].sort((a,b)=>a.date.localeCompare(b.date));

  return <main className="admin-app">
    <aside className="admin-sidebar"><Link href="/admin" className="admin-brand"><span className="brand-mark"><CalendarDays size={18}/></span><span><b>JAY BOYS</b><small>WORK CALENDAR</small></span></Link><div className="admin-nav"><div className="admin-nav-group"><span>COMMAND</span><Link href="/admin"><Activity size={15}/><span>Overview</span></Link><Link className="active" href="/admin/calendar"><CalendarDays size={15}/><span>Calendar</span></Link></div></div><div className="admin-sidebar-foot"><Link href="/admin">Back to admin</Link><Link href="/api/auth/signout"><LogOut size={14}/>Sign out</Link></div></aside>
    <section className="admin-main"><header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><CalendarDays size={17}/><span>JAY BOYS</span></span></Link></header><div className="admin-content">
      <div className="admin-page-head"><div><div className="eyebrow"><CalendarDays size={14}/> SHARED OPERATIONS TIMELINE</div><h1>Calendar.</h1><p>One view for resident leave, staff deadlines, visitors and maintenance activity.</p></div><Link className="button" href="/admin"><ArrowLeft size={15}/> Command center</Link></div>
      <div className="admin-card"><div className="admin-card-head"><div><span>UPCOMING / RECENT</span><h2>{events.length} operational records</h2></div><CalendarDays/></div>
        {events.length?<div className="admin-record-list">{events.map((event,index)=><div className="admin-record" key={index}><div className="admin-record-main"><b>{event.title}</b><small>{event.detail}</small></div><span className="admin-count">{event.date} · {event.status}</span></div>)}</div>:<div className="empty-state">No calendar activity is available yet. Add leave requests, staff tasks or visitors from the operations modules.</div>}
      </div>
    </div></section>
  </main>
}
