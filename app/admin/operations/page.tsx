import Link from "next/link";
import { AlertTriangle, CalendarDays, ClipboardList, LogOut, UserCheck, Wrench } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
export const dynamic="force-dynamic";

export default async function OperationsPage(){
  const {db}=await requireAdmin();
  const [visitors,maintenance,leave,attendance]=await Promise.all([
    db.from("visitors").select("id",{count:"exact",head:true}).eq("visit_date",new Date().toISOString().slice(0,10)),
    db.from("maintenance_requests").select("id",{count:"exact",head:true}).in("status",["open","assigned","in_progress"]),
    db.from("leave_requests").select("id",{count:"exact",head:true}).eq("status","pending"),
    db.from("attendance").select("id",{count:"exact",head:true}).eq("attendance_date",new Date().toISOString().slice(0,10)),
  ]);
  const cards=[
    ["Visitors today",visitors.count||0,"/admin/visitors",UserCheck,"Register visitors and check-in/out."],
    ["Open maintenance",maintenance.count||0,"/admin/maintenance",Wrench,"Track repairs by room and resolution."],
    ["Leave approvals",leave.count||0,"/admin/leave_requests",CalendarDays,"Review resident leave requests."],
    ["Attendance marked",attendance.count||0,"/admin/attendance",ClipboardList,"Review today's attendance records."],
  ] as const;
  return <main className="admin-app"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand" prefetch={false}>JAY BOYS</Link><div className="admin-nav"><div className="admin-nav-group"><span>CORE WORKSPACE</span><Link href="/admin" prefetch={false}>Overview</Link><Link href="/admin/floor-map" prefetch={false}>Floor Occupancy</Link><Link href="/admin/members" prefetch={false}>Residents</Link><Link href="/admin/applications" prefetch={false}>Admissions</Link><Link href="/admin/billing" prefetch={false}>Billing</Link><Link href="/admin/operations" prefetch={false} className="active">Operations</Link><Link href="/admin/complaints" prefetch={false}>Complaints</Link></div><div className="admin-nav-group"><span>CONTROL</span><Link href="/admin/website" prefetch={false}>Website</Link><Link href="/admin/settings" prefetch={false}>Settings</Link></div></div><div className="admin-sidebar-foot"><Link href="/api/auth/signout" prefetch={false}><LogOut size={13}/> Sign out</Link></div></aside>
  <section className="admin-main"><div className="admin-content"><div className="admin-page-head"><div><div className="eyebrow"><Wrench size={14}/> DAILY OPERATIONS</div><h1>Operations hub.</h1><p>Keep daily hostel work together instead of maintaining separate primary modules.</p></div></div>
  <section className="admin-metric-grid">{cards.map(([title,count])=><article className="admin-stat" key={title}><div><span>{title.toUpperCase()}</span><b>{count}</b></div><Wrench/></article>)}</section>
  <div className="admin-dashboard-grid" style={{marginTop:12}}>{cards.map(([title,count,href,Icon,desc])=><Link className="admin-card admin-control-grid" href={href} prefetch={false} key={title}><Icon/><span><b>{title}</b><small>{desc}</small></span></Link>)}</div>
  </div></section></main>;
}
