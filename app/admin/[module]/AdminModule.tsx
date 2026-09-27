"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowLeft, Bell, Building2, CalendarDays, CheckCircle2, ClipboardList,
  Database, Edit3, FileCheck2, FileText, IndianRupee, LayoutDashboard, LifeBuoy,
  LogOut, Megaphone, Plus, RefreshCw, Save, Search, Settings2, ShieldCheck,
  Trash2, UserRound, Users, WalletCards, Wrench, Package, UserCheck, ReceiptText
} from "lucide-react";

type Row = Record<string, any>;
type Option = { value: string; label: string };
type Field = {
  key: string; label: string;
  type?: "text" | "textarea" | "number" | "date" | "datetime-local" | "select" | "json";
  required?: boolean; placeholder?: string; options?: Option[]; relation?: string; help?: string;
};
type ModuleConfig = { title: string; table: string; description: string; icon: any; group: string; fields: Field[] };

const text = (key:string,label:string,extra:Partial<Field>={}) => ({key,label,type:"text" as const,...extra});
const select = (key:string,label:string,options:Option[],extra:Partial<Field>={}) => ({key,label,type:"select" as const,options,...extra});
const relation = (key:string,label:string,table:string,extra:Partial<Field>={}) => ({key,label,type:"select" as const,relation:table,...extra});
const STATUS = (items:string[]) => items.map(value=>({value,label:value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}));
const BOOL = [{value:"true",label:"Enabled"},{value:"false",label:"Disabled"}];

const MODULES: Record<string, ModuleConfig> = {
  website:{title:"Website control",table:"site_content",description:"Edit public website sections, messaging and calls-to-action.",icon:Megaphone,group:"Website",
    fields:[text("key","Content key",{required:true}),text("section","Section",{required:true}),text("title","Title"),text("subtitle","Subtitle"),{key:"body",label:"Body",type:"textarea"},text("cta_label","Button label"),text("cta_href","Button link"),{key:"value",label:"Advanced value",type:"json"},select("active","Published",BOOL)]},
  members:{title:"Residents",table:"members",description:"Create and maintain complete resident profiles and lifecycle records.",icon:Users,group:"Residents",
    fields:[text("member_code","Resident code",{help:"Leave blank to auto-generate."}),text("full_name","Full name",{required:true}),text("father_name","Father name"),text("mother_name","Mother name"),text("phone","Primary phone",{required:true}),text("alternate_phone","Alternate phone"),text("email","Email"),{key:"dob",label:"Date of birth",type:"date"},text("gender","Gender"),text("id_type","ID type"),text("id_number_masked","Masked ID number"),{key:"address",label:"Address",type:"textarea"},text("city","City"),text("state","State"),text("postal_code","Postal code"),text("institution","Institution / college"),text("course","Course"),text("academic_year","Academic year"),text("enrollment_number","Enrollment number"),select("status","Resident status",STATUS(["active","notice_period","checkout_pending","checked_out","archived"]))]},
  applications:{title:"Admissions",table:"applications",description:"Review applicants, update status and keep the admission queue moving.",icon:ClipboardList,group:"Residents",
    fields:[text("application_code","Application code",{help:"Leave blank to auto-generate."}),relation("member_id","Resident","members"),select("status","Application status",STATUS(["draft","submitted","under_review","documents_required","approved","rejected","cancelled"])),{key:"submitted_at",label:"Submitted at",type:"datetime-local"},{key:"reviewed_at",label:"Reviewed at",type:"datetime-local"},text("reviewed_by","Reviewed by user ID"),{key:"admin_note",label:"Admin note",type:"textarea"}]},
  guardians:{title:"Guardians & emergency contacts",table:"member_guardians",description:"Maintain guardian, family and emergency-contact records.",icon:UserRound,group:"Residents",
    fields:[relation("member_id","Resident","members",{required:true}),text("name","Guardian name",{required:true}),text("relationship","Relationship"),text("phone","Phone",{required:true}),text("alternate_phone","Alternate phone"),{key:"address",label:"Address",type:"textarea"}]},
  documents:{title:"Resident documents",table:"documents",description:"Track document metadata, verification state and review notes.",icon:FileText,group:"Residents",
    fields:[relation("member_id","Resident","members",{required:true}),relation("document_type_id","Document type","document_types"),text("storage_path","Storage path",{required:true}),text("original_filename","Original filename",{required:true}),text("mime_type","MIME type"),{key:"size_bytes",label:"Size in bytes",type:"number"},select("status","Status",STATUS(["uploaded","verified","rejected","expired"])),{key:"verification_note",label:"Verification note",type:"textarea"},text("verified_by","Verified by user ID")]},
  tenancies:{title:"Stay & room allocation",table:"tenancies",description:"Assign residents to rooms and beds, manage rent and checkout dates.",icon:Building2,group:"Residents",
    fields:[relation("member_id","Resident","members",{required:true}),relation("room_id","Room","rooms",{required:true}),relation("bed_id","Bed","beds",{required:true}),{key:"check_in_date",label:"Check-in date",type:"date",required:true},{key:"billing_start_date",label:"Billing start",type:"date",required:true},{key:"expected_checkout_date",label:"Expected checkout",type:"date"},{key:"check_out_date",label:"Actual checkout",type:"date"},{key:"rent_amount",label:"Rent amount",type:"number"},{key:"security_deposit",label:"Security deposit",type:"number"},select("status","Tenancy status",STATUS(["active","notice_period","checkout_pending","checked_out","archived"])),{key:"notes",label:"Notes",type:"textarea"}]},
  leave_requests:{title:"Leave requests",table:"leave_requests",description:"Review resident leave requests and approval status.",icon:CalendarDays,group:"Residents",
    fields:[relation("member_id","Resident","members",{required:true}),{key:"start_date",label:"Start date",type:"date",required:true},{key:"end_date",label:"End date",type:"date",required:true},{key:"reason",label:"Reason",type:"textarea",required:true},select("status","Status",STATUS(["pending","approved","rejected","cancelled"]))]},
  notifications:{title:"Resident notifications",table:"notifications",description:"Create or schedule in-app notifications for residents.",icon:Bell,group:"Communication",
    fields:[text("user_id","Auth user ID",{required:true}),text("title","Title",{required:true}),{key:"body",label:"Message",type:"textarea",required:true},text("type","Notification type"),{key:"scheduled_for",label:"Schedule for",type:"datetime-local"}]},
  announcements:{title:"Announcements",table:"announcements",description:"Publish resident-wide operational announcements.",icon:Megaphone,group:"Communication",
    fields:[relation("hostel_id","Hostel","hostels",{required:true}),text("title","Title",{required:true}),{key:"message",label:"Message",type:"textarea",required:true},select("priority","Priority",STATUS(["low","normal","high","urgent"])),text("audience","Audience"),{key:"publish_at",label:"Publish at",type:"datetime-local"},{key:"expires_at",label:"Expires at",type:"datetime-local"}]},
  complaints:{title:"Complaints & support",table:"complaints",description:"Assign, investigate and resolve resident complaints.",icon:LifeBuoy,group:"Communication",
    fields:[relation("member_id","Resident","members",{required:true}),relation("room_id","Room","rooms"),text("title","Issue title",{required:true}),{key:"description",label:"Description",type:"textarea",required:true},text("category","Category"),select("priority","Priority",STATUS(["low","normal","high","urgent"])),select("status","Status",STATUS(["submitted","acknowledged","assigned","in_progress","resolved","closed","reopened"])),text("assigned_to","Assigned staff user ID"),{key:"resolution",label:"Resolution",type:"textarea"}]},
  complaint_comments:{title:"Complaint conversation",table:"complaint_comments",description:"Add internal or resident-visible complaint comments.",icon:LifeBuoy,group:"Communication",
    fields:[relation("complaint_id","Complaint","complaints",{required:true}),text("author_id","Author user ID"),{key:"body",label:"Comment",type:"textarea",required:true},select("internal","Internal note",BOOL)]},
  rooms:{title:"Rooms",table:"rooms",description:"Manage room inventory, capacity, pricing and availability.",icon:Building2,group:"Hostel",
    fields:[relation("floor_id","Floor","floors",{required:true}),text("room_number","Room number",{required:true}),text("room_type","Room type",{required:true}),{key:"capacity",label:"Capacity",type:"number",required:true},{key:"monthly_rate",label:"Monthly rate",type:"number"},{key:"daily_rate",label:"Daily rate",type:"number"},{key:"security_deposit",label:"Security deposit",type:"number"},select("status","Room status",STATUS(["available","partially_occupied","full","maintenance","inactive"])),{key:"notes",label:"Notes",type:"textarea"}]},
  beds:{title:"Beds",table:"beds",description:"Track every bed and its live occupancy status.",icon:Building2,group:"Hostel",
    fields:[relation("room_id","Room","rooms",{required:true}),text("bed_label","Bed label",{required:true}),select("status","Bed status",STATUS(["available","occupied","reserved","maintenance","inactive"]))]},
  hostels:{title:"Hostel profile",table:"hostels",description:"Manage the public and operational identity of the hostel.",icon:Building2,group:"Hostel",
    fields:[text("name","Hostel name",{required:true}),{key:"address",label:"Address",type:"textarea"},text("city","City"),text("state","State"),text("postal_code","Postal code"),text("phone","Phone"),text("email","Email"),text("logo_url","Logo URL"),text("latitude","Latitude"),text("longitude","Longitude")]},
  buildings:{title:"Buildings",table:"buildings",description:"Manage hostel buildings and their order.",icon:Building2,group:"Hostel",
    fields:[relation("hostel_id","Hostel","hostels",{required:true}),text("name","Building name",{required:true}),{key:"sort_order",label:"Display order",type:"number"}]},
  floors:{title:"Floors",table:"floors",description:"Manage floors and their display order.",icon:Building2,group:"Hostel",
    fields:[relation("building_id","Building","buildings",{required:true}),text("name","Floor name",{required:true}),{key:"sort_order",label:"Display order",type:"number"}]},
  document_types:{title:"Document types",table:"document_types",description:"Define documents required for admission and resident records.",icon:FileCheck2,group:"Hostel",
    fields:[relation("hostel_id","Hostel","hostels",{required:true}),text("name","Document name",{required:true}),select("required_for_application","Required for admission",BOOL),select("active","Active",BOOL)]},
  pricing:{title:"Pricing plans",table:"pricing_plans",description:"Manage standard room pricing and billing methods.",icon:IndianRupee,group:"Hostel",
    fields:[relation("hostel_id","Hostel","hostels",{required:true}),text("name","Plan name",{required:true}),text("room_type","Room type"),{key:"monthly_rate",label:"Monthly rate",type:"number"},{key:"daily_rate",label:"Daily rate",type:"number"},text("billing_method","Billing method"),select("active","Active",BOOL)]},
  billing:{title:"Invoices",table:"invoices",description:"Create, update and track resident invoices.",icon:WalletCards,group:"Finance",
    fields:[text("invoice_number","Invoice number",{help:"Leave blank to auto-generate."}),relation("member_id","Resident","members",{required:true}),relation("tenancy_id","Tenancy","tenancies"),{key:"period_start",label:"Period start",type:"date",required:true},{key:"period_end",label:"Period end",type:"date",required:true},{key:"issue_date",label:"Issue date",type:"date"},{key:"due_date",label:"Due date",type:"date",required:true},{key:"subtotal",label:"Subtotal",type:"number"},{key:"discount",label:"Discount",type:"number"},{key:"late_fee",label:"Late fee",type:"number"},{key:"total",label:"Total",type:"number"},{key:"paid_amount",label:"Paid amount",type:"number"},select("status","Invoice status",STATUS(["draft","issued","partially_paid","paid","overdue","cancelled"]))]},
  invoice_items:{title:"Invoice line items",table:"invoice_items",description:"Manage individual charges that make up an invoice.",icon:ReceiptText,group:"Finance",
    fields:[relation("invoice_id","Invoice","invoices",{required:true}),text("description","Description",{required:true}),{key:"quantity",label:"Quantity",type:"number"},{key:"unit_price",label:"Unit price",type:"number"},{key:"total",label:"Line total",type:"number"}]},
  payments:{title:"Payments",table:"payments",description:"Record resident payments and transaction references.",icon:IndianRupee,group:"Finance",
    fields:[text("payment_number","Payment number",{help:"Leave blank to auto-generate."}),relation("member_id","Resident","members",{required:true}),relation("invoice_id","Invoice","invoices"),{key:"amount",label:"Amount",type:"number",required:true},{key:"payment_date",label:"Payment date",type:"datetime-local"},text("method","Payment method"),text("transaction_id","Transaction ID"),{key:"notes",label:"Notes",type:"textarea"}]},
  expenses:{title:"Expenses",table:"expenses",description:"Record hostel operating expenses and vendor payments.",icon:IndianRupee,group:"Finance",
    fields:[relation("hostel_id","Hostel","hostels",{required:true}),text("category","Category"),text("description","Description",{required:true}),{key:"amount",label:"Amount",type:"number",required:true},{key:"expense_date",label:"Expense date",type:"date"},text("vendor","Vendor"),text("payment_method","Payment method"),text("reference","Reference"),{key:"notes",label:"Notes",type:"textarea"}]},
  visitors:{title:"Visitor register",table:"visitors",description:"Register visitors, expected arrivals and checkout times.",icon:UserCheck,group:"Operations",
    fields:[relation("member_id","Resident","members"),text("visitor_name","Visitor name",{required:true}),text("phone","Phone"),text("relationship","Relationship"),text("purpose","Purpose"),{key:"visit_date",label:"Visit date",type:"date"},{key:"check_in",label:"Check-in",type:"datetime-local"},{key:"check_out",label:"Check-out",type:"datetime-local"},select("status","Status",STATUS(["expected","checked_in","checked_out","cancelled"])),{key:"notes",label:"Notes",type:"textarea"}]},
  maintenance:{title:"Maintenance",table:"maintenance_requests",description:"Track room repairs, assignments, priorities and resolutions.",icon:Wrench,group:"Operations",
    fields:[relation("room_id","Room","rooms"),text("title","Issue title",{required:true}),{key:"description",label:"Description",type:"textarea",required:true},select("priority","Priority",STATUS(["low","normal","high","urgent"])),select("status","Status",STATUS(["open","assigned","in_progress","resolved","closed"])),text("assigned_to","Assigned staff user ID"),{key:"resolution",label:"Resolution",type:"textarea"}]},
  inventory:{title:"Inventory",table:"inventory_items",description:"Track stock, reorder levels, locations and inventory status.",icon:Package,group:"Operations",
    fields:[relation("hostel_id","Hostel","hostels",{required:true}),text("name","Item name",{required:true}),text("category","Category"),text("sku","SKU"),{key:"quantity",label:"Quantity",type:"number"},{key:"reorder_level",label:"Reorder level",type:"number"},text("unit","Unit"),text("location","Location"),select("status","Status",STATUS(["active","low_stock","out_of_stock","inactive"])),{key:"notes",label:"Notes",type:"textarea"}]},
  attendance:{title:"Attendance",table:"attendance",description:"Mark daily resident attendance and maintain a searchable register.",icon:CalendarDays,group:"Operations",
    fields:[relation("member_id","Resident","members",{required:true}),{key:"attendance_date",label:"Date",type:"date",required:true},select("status","Status",STATUS(["present","absent","late","leave"])),{key:"note",label:"Note",type:"textarea"}]},
  staff_tasks:{title:"Staff tasks",table:"staff_tasks",description:"Create operational tasks, due dates and assignments.",icon:ClipboardList,group:"Operations",
    fields:[text("title","Task title",{required:true}),{key:"description",label:"Description",type:"textarea"},select("priority","Priority",STATUS(["low","normal","high","urgent"])),select("status","Status",STATUS(["open","in_progress","blocked","done","cancelled"])),{key:"due_date",label:"Due date",type:"date"},text("assigned_to","Assigned staff user ID")]},
  settings:{title:"System settings",table:"settings",description:"Control application configuration stored in the database.",icon:Settings2,group:"System",
    fields:[text("key","Setting key",{required:true}),{key:"value",label:"Value",type:"json",required:true}]},
  feature_flags:{title:"Feature flags",table:"feature_flags",description:"Turn platform modules on or off without code changes.",icon:Activity,group:"System",
    fields:[text("key","Feature key",{required:true}),select("enabled","Enabled",BOOL)]},
  roles:{title:"Roles & permissions",table:"user_roles",description:"Grant application roles to authenticated users.",icon:ShieldCheck,group:"System",
    fields:[text("user_id","Auth user ID",{required:true}),select("role","Role",STATUS(["super_admin","admin","manager","staff","accountant","member"]),{required:true})]},
  profiles:{title:"User profiles",table:"profiles",description:"Manage staff and resident profile metadata and active state.",icon:UserRound,group:"System",
    fields:[text("id","Auth user ID",{required:true}),text("full_name","Full name",{required:true}),text("email","Email"),text("phone","Phone"),select("is_active","Active",BOOL)]},
  audit:{title:"Audit log",table:"audit_logs",description:"Review administrative mutations and resulting data.",icon:Database,group:"System",
    fields:[text("actor_id","Actor ID"),text("action","Action"),text("entity_type","Entity"),text("entity_id","Entity ID"),{key:"reason",label:"Reason",type:"textarea"},{key:"new_data",label:"New data",type:"json"}]},
};

const NAV = [
  ["Overview","/admin","dashboard"],["Website","/admin/website","website"],["Residents","/admin/members","members"],
  ["Admissions","/admin/applications","applications"],["Guardians","/admin/guardians","guardians"],["Documents","/admin/documents","documents"],
  ["Stay & Allocations","/admin/tenancies","tenancies"],["Leave Requests","/admin/leave_requests","leave_requests"],["Rooms","/admin/rooms","rooms"],
  ["Beds","/admin/beds","beds"],["Visitors","/admin/visitors","visitors"],["Maintenance","/admin/maintenance","maintenance"],["Inventory","/admin/inventory","inventory"],
  ["Invoices","/admin/billing","billing"],["Invoice Items","/admin/invoice_items","invoice_items"],["Payments","/admin/payments","payments"],["Expenses","/admin/expenses","expenses"],
  ["Complaints","/admin/complaints","complaints"],["Announcements","/admin/announcements","announcements"],["Notifications","/admin/notifications","notifications"],
  ["Attendance","/admin/attendance","attendance"],["Staff Tasks","/admin/staff_tasks","staff_tasks"],["Hostel Profile","/admin/hostels","hostels"],["Buildings","/admin/buildings","buildings"],
  ["Floors","/admin/floors","floors"],["Pricing","/admin/pricing","pricing"],["Document Types","/admin/document_types","document_types"],["Settings","/admin/settings","settings"],
  ["Feature Flags","/admin/feature_flags","feature_flags"],["Roles","/admin/roles","roles"],["Audit Log","/admin/audit","audit"]
] as const;
const GROUPS = ["Website","Residents","Operations","Hostel","Finance","Communication","System"];

function blank(config:ModuleConfig){return Object.fromEntries(config.fields.map(f=>[f.key,f.type==="number"?0:f.type==="json"?"{}":f.type==="select"&&f.options?.length?f.options[0].value:""]))}
function labelFor(row:Row){for(const k of ["full_name","name","title","room_number","application_code","invoice_number","payment_number","visitor_name","key","member_code","sku"])if(row[k])return String(row[k]);return row.id?String(row.id).slice(0,12):"Record"}
function inputDate(value:any,type:string){if(!value)return "";const s=String(value);return type==="date"?s.slice(0,10):type==="datetime-local"?s.slice(0,16):s}

export default function AdminModule({module}:{module:string}){
  const config=MODULES[module]||MODULES.website; const Icon=config.icon;
  const [rows,setRows]=useState<Row[]>([]); const [selected,setSelected]=useState<Row|null>(null);
  const [form,setForm]=useState<Row>(()=>blank(config)); const [relations,setRelations]=useState<Record<string,Option[]>>({});
  const [query,setQuery]=useState(""); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [advanced,setAdvanced]=useState(false);
  const visible=useMemo(()=>{const q=query.trim().toLowerCase();return q?rows.filter(r=>Object.values(r).some(v=>String(v??"").toLowerCase().includes(q))):rows},[rows,query]);

  async function load(){
    setBusy(true);setError("");
    try{const r=await fetch("/api/admin/data?table="+encodeURIComponent(config.table)+"&limit=500&q="+encodeURIComponent(query),{cache:"no-store",credentials:"same-origin"});const p=await r.json();if(r.status===401){window.location.href="/login";return}if(!r.ok)throw new Error(p.error||"Unable to load records.");setRows(p.data||[])}
    catch(e){setError(e instanceof Error?e.message:"Unable to load records.")}finally{setBusy(false)}
  }
  async function loadRelations(){
    const tables=[...new Set(config.fields.map(f=>f.relation).filter(Boolean) as string[])];const next:Record<string,Option[]>={};
    await Promise.all(tables.map(async table=>{try{const r=await fetch("/api/admin/data?table="+table+"&limit=500",{cache:"no-store",credentials:"same-origin"});const p=await r.json();next[table]=(p.data||[]).map((row:Row)=>({value:String(row.id??row.key??""),label:labelFor(row)+(row.member_code?" · "+row.member_code:"")}))}catch{next[table]=[]}}));setRelations(next);
  }
  useEffect(()=>{setSelected(null);setForm(blank(config));setQuery("");setAdvanced(false);void loadRelations()},[config.table]);
  useEffect(()=>{const t=setTimeout(()=>void load(),250);return()=>clearTimeout(t)},[config.table,query]);

  function edit(row:Row){const next:Row={};for(const f of config.fields){const fallback=f.type==="select"?(f.options?.[0]?.value??""):"";next[f.key]=f.type==="date"||f.type==="datetime-local"?inputDate(row[f.key],f.type):f.type==="json"?JSON.stringify(row[f.key]??{},null,2):(row[f.key]??fallback)}setSelected(row);setForm(next);setError("");setMessage("")}
  function clear(){setSelected(null);setForm(blank(config));setError("");setMessage("");setAdvanced(false)}
  function setField(k:string,v:any){setForm((x:Row)=>({...x,[k]:v}))}
  function selector(row:Row|null){if(!row)return undefined;if(["settings","feature_flags","site_content"].includes(config.table))return{key:String(row.key)};if(config.table==="user_roles")return{user_id:String(row.user_id),role:String(row.role)};return undefined}

  async function save(){
    setBusy(true);setError("");setMessage("");
    try{
      const data:Row={...form};
      for(const f of config.fields){
        if(f.type==="number"&&data[f.key]!==""&&data[f.key]!==undefined)data[f.key]=Number(data[f.key]);
        if(["enabled","active","is_active","required_for_application","internal"].includes(f.key))data[f.key]=data[f.key]===true||data[f.key]==="true";
        if(f.type==="json"&&typeof data[f.key]==="string")data[f.key]=JSON.parse(data[f.key]||"{}");
        if(f.type==="datetime-local"&&data[f.key])data[f.key]=new Date(data[f.key]).toISOString();
      }
      const required=config.fields.find(f=>f.required&&(data[f.key]===undefined||data[f.key]===null||String(data[f.key]).trim()===""));if(required)throw new Error(required.label+" is required.");
      const r=await fetch("/api/admin/data",{method:selected?"PATCH":"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({table:config.table,id:selected?.id,selector:selected&&!selected.id?selector(selected):undefined,data})});const p=await r.json();if(r.status===401){window.location.href="/login";return}if(!r.ok)throw new Error(p.error||"Save failed.");setMessage(selected?"Record updated successfully.":"Record created successfully.");if(p.data)edit(p.data);await load();
    }catch(e){setError(e instanceof Error?e.message:"Unable to save record.")}finally{setBusy(false)}
  }
  async function remove(row:Row){
    if((!row.id&&!selector(row))||!window.confirm("Delete “"+labelFor(row)+"” permanently?"))return;setBusy(true);setError("");setMessage("");
    try{const r=await fetch("/api/admin/data",{method:"DELETE",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({table:config.table,id:row.id,selector:row.id?undefined:selector(row)})});const p=await r.json();if(r.status===401){window.location.href="/login";return}if(!r.ok)throw new Error(p.error||"Delete failed.");clear();setMessage("Record deleted successfully.");await load()}catch(e){setError(e instanceof Error?e.message:"Delete failed.")}finally{setBusy(false)}
  }
  const options=(f:Field)=>f.relation?relations[f.relation]||[]:f.options||[];

  return <main className="admin-app">
    <aside className="admin-sidebar"><Link href="/admin" prefetch={false} className="admin-brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>OPERATIONS OS</small></span></Link><div className="admin-nav">{GROUPS.map(group=><div className="admin-nav-group" key={group}><span>{group}</span>{NAV.filter(n=>MODULES[n[2]]?.group===group).map(([label,href,key])=><Link className={module===key?"active":""} href={href} prefetch={false} key={key}>{label}</Link>)}</div>)}</div><div className="admin-sidebar-foot"><Link href="/api/auth/signout" prefetch={false}><LogOut size={13}/> Sign out</Link><Link href="/" prefetch={false}>View website</Link></div></aside>
    <section className="admin-main"><header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><Building2 size={17}/></span><span><b>JAY BOYS</b><small>ADMIN</small></span></Link><Link href="/api/auth/signout" className="icon-button"><ArrowLeft size={15}/></Link></header>
      <div className="admin-content">
        <div className="admin-breadcrumb"><Link href="/admin" prefetch={false}><LayoutDashboard size={14}/> Dashboard</Link><span>/</span><b>{config.title}</b></div>
        <div className="admin-page-head"><div><div className="eyebrow"><Icon size={14}/> {config.group.toUpperCase()} / WORKSPACE</div><h1>{config.title}</h1><p>{config.description}</p></div><div className="admin-head-actions"><button className="button ghost" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Refresh</button><button className="button primary" onClick={clear}><Plus size={15}/> Add record</button></div></div>
        {message&&<div className="admin-success"><CheckCircle2 size={14}/>{message}</div>}{error&&<div className="admin-error"><Activity size={14}/>{error}</div>}
        <div className="admin-workbar"><label className="admin-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={"Search "+config.title.toLowerCase()+"…"}/></label><span className="admin-count">{visible.length} records</span></div>
        <div className="admin-editor-grid">
          <div className="admin-card"><div className="admin-card-head"><div><span>DATABASE RECORDS</span><h2>{visible.length} visible</h2></div><Database size={18}/></div><div className="admin-record-list">{visible.length?visible.map(row=><article key={String(row.id??row.key??JSON.stringify(row))} className={selected&&((selected.id&&selected.id===row.id)||(selected.key&&selected.key===row.key))?"admin-record active":"admin-record"}><div className="admin-record-main"><b>{labelFor(row)}</b><small>{String(row.status??row.priority??row.email??row.phone??row.category??row.section??"Ready")}</small></div><div className="admin-record-actions"><button className="icon-button" title="Edit" onClick={()=>edit(row)}><Edit3 size={14}/></button><button className="icon-button danger" title="Delete" onClick={()=>void remove(row)}><Trash2 size={14}/></button></div></article>):<div className="empty-state"><Database size={24}/><b>No records found</b><span>Create the first record with the form.</span></div>}</div></div>
          <div className="admin-card admin-form-card"><div className="admin-card-head"><div><span>{selected?"EDIT RECORD":"NEW RECORD"}</span><h2>{selected?"Update details":"Create record"}</h2></div><Save size={18}/></div>
            <div className="admin-form-grid">{config.fields.map(f=>{const value=form[f.key]??"";const opts=options(f);if(f.type==="json"&&!advanced)return null;if(f.type==="textarea"||f.type==="json")return <label className="admin-field wide" key={f.key}><span>{f.label}{f.required&&" *"}</span><textarea className={f.type==="json"?"admin-code-field":""} value={value} onChange={e=>setField(f.key,e.target.value)} spellCheck={f.type==="json"?false:true} placeholder={f.placeholder}/>{f.help&&<small>{f.help}</small>}</label>;if(f.type==="select"||f.relation)return <label className="admin-field" key={f.key}><span>{f.label}{f.required&&" *"}</span><select value={String(value)} onChange={e=>setField(f.key,e.target.value)}><option value="">Select {f.label}</option>{opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>{f.help&&<small>{f.help}</small>}</label>;return <label className="admin-field" key={f.key}><span>{f.label}{f.required&&" *"}</span><input type={f.type||"text"} value={f.type==="date"||f.type==="datetime-local"?inputDate(value,f.type):value} onChange={e=>setField(f.key,e.target.value)} placeholder={f.placeholder}/>{f.help&&<small>{f.help}</small>}</label>})}</div>
            {config.fields.some(f=>f.type==="json")&&<button type="button" className="admin-advanced-toggle" onClick={()=>setAdvanced(v=>!v)}>{advanced?"Hide advanced fields":"Show advanced fields"}</button>}
            <div className="admin-form-actions"><button className="button ghost" onClick={clear} disabled={busy}>Clear</button><button className="button primary" onClick={()=>void save()} disabled={busy}><Save size={15}/>{busy?"Saving…":selected?"Update record":"Create record"}</button></div>
            {selected&&<p className="admin-form-note">Editing a live database record. Deletion is available from the record list.</p>}
          </div>
        </div>
      </div>
    </section>
  </main>;
}
