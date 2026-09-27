"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BedDouble, Building2, Check, IndianRupee, RefreshCw, UserRound, Users, X } from "lucide-react";

type Resident={id:string;member_code?:string;full_name:string;phone?:string;photo_url?:string|null};
type Bed={id:string;bed_label:string;status:string;resident?:Resident|null;tenancy?:{status:string;check_in_date:string;expected_checkout_date?:string|null}|null};
type Room={id:string;room_number:string;room_type:string;capacity:number;monthly_rate:number;status:string;beds:Bed[]};
type Floor={id:string;name:string;rooms:Room[]};
type Building={id:string;name:string;floors:Floor[]};

export default function FloorOccupancyPage(){
  const [buildings,setBuildings]=useState<Building[]>([]);
  const [busy,setBusy]=useState(true); const [error,setError]=useState("");
  const [activeBuilding,setActiveBuilding]=useState(""); const [query,setQuery]=useState("");
  const [residents,setResidents]=useState<Resident[]>([]); const [allocationBed,setAllocationBed]=useState<Bed|null>(null);
  const [residentId,setResidentId]=useState(""); const [checkIn,setCheckIn]=useState(new Date().toISOString().slice(0,10)); const [allocating,setAllocating]=useState(false);

  async function load(){
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/admin/floor-occupancy",{cache:"no-store",credentials:"same-origin"});
      const p=await r.json();
      if(r.status===401){window.location.href="/login";return}
      if(!r.ok)throw new Error(p.error||"Unable to load floor occupancy.");
      setBuildings(p.buildings||[]);
      if(!activeBuilding && p.buildings?.[0])setActiveBuilding(p.buildings[0].id);
    }catch(e){setError(e instanceof Error?e.message:"Unable to load floor occupancy.")}finally{setBusy(false)}
  }
  async function loadResidents(){
    const r=await fetch("/api/admin/data?table=members&limit=500&q=",{cache:"no-store",credentials:"same-origin"});
    const p=await r.json();
    if(r.ok)setResidents((p.data||[]).filter((x:any)=>["active","notice_period","checkout_pending"].includes(x.status)));
  }
  useEffect(()=>{void load()},[]);
  const building=buildings.find(b=>b.id===activeBuilding)||buildings[0];
  const q=query.trim().toLowerCase();
  const floors=useMemo(()=>{
    if(!building)return [];
    return building.floors.map(f=>({...f,rooms:f.rooms.filter(r=>!q||r.room_number.toLowerCase().includes(q)||r.beds.some(b=>b.resident?.full_name.toLowerCase().includes(q)))})).filter(f=>f.rooms.length);
  },[building,q]);
  const totalRooms=building?.floors.reduce((n,f)=>n+f.rooms.length,0)||0;
  const capacity=building?.floors.reduce((n,f)=>n+f.rooms.reduce((x,r)=>x+r.capacity,0),0)||0;
  const occupiedBeds=building?.floors.reduce((n,f)=>n+f.rooms.reduce((x,r)=>x+r.beds.filter(b=>b.resident).length,0),0)||0;
  const availableBeds=Math.max(capacity-occupiedBeds,0);

  async function allocate(){
    if(!allocationBed||!residentId)return;
    setAllocating(true);setError("");
    try{
      const r=await fetch("/api/admin/allocation",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({bed_id:allocationBed.id,member_id:residentId,check_in_date:checkIn})});
      const p=await r.json(); if(!r.ok)throw new Error(p.error||"Unable to allocate resident.");
      setAllocationBed(null);setResidentId("");await load();
    }catch(e){setError(e instanceof Error?e.message:"Unable to allocate resident.")}finally{setAllocating(false)}
  }
  async function release(bed:Bed){
    if(!bed.resident||!window.confirm(`Check out ${bed.resident.full_name} from this bed?`))return;
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/admin/allocation",{method:"DELETE",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({bed_id:bed.id})});
      const p=await r.json();if(!r.ok)throw new Error(p.error||"Unable to check out resident.");await load();
    }catch(e){setError(e instanceof Error?e.message:"Unable to check out resident.")}finally{setBusy(false)}
  }

  return <main className="admin-app">
    <aside className="admin-sidebar">
      <Link href="/admin" prefetch={false} className="admin-brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>HOSTEL OPERATIONS</small></span></Link>
      <div className="admin-nav"><div className="admin-nav-group"><span>CORE WORKSPACE</span><Link href="/admin" prefetch={false}>Overview</Link><Link className="active" href="/admin/floor-map" prefetch={false}>Floor Occupancy</Link><Link href="/admin/members" prefetch={false}>Residents</Link><Link href="/admin/applications" prefetch={false}>Admissions</Link><Link href="/admin/billing" prefetch={false}>Billing</Link><Link href="/admin/complaints" prefetch={false}>Complaints</Link></div><div className="admin-nav-group"><span>CONTROL</span><Link href="/admin/website" prefetch={false}>Website</Link><Link href="/admin/settings" prefetch={false}>Settings</Link></div></div>
      <div className="admin-sidebar-foot"><Link href="/api/auth/signout" prefetch={false}>Sign out</Link><Link href="/" prefetch={false}>View website</Link></div>
    </aside>
    <section className="admin-main">
      <header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><Building2 size={17}/></span><span><b>JAY BOYS</b><small>FLOOR MAP</small></span></Link></header>
      <div className="admin-content">
        <div className="admin-breadcrumb"><Link href="/admin" prefetch={false}><ArrowLeft size={14}/> Dashboard</Link><span>/</span><b>Floor occupancy</b></div>
        <div className="admin-page-head"><div><div className="eyebrow"><Building2 size={14}/> SINGLE BUILDING / LIVE INVENTORY</div><h1>Floor & room view.</h1><p>Manage the real 14-room, 31-bed hostel layout, see resident photos and allocate or release beds without opening another module.</p></div><button className="button ghost" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Refresh</button></div>
        {error&&<div className="admin-error">{error}</div>}
        <div className="occupancy-hero">
          <div className="occupancy-3d-building"><div className="tower-cap">JAY BOYS</div><div className="tower-floors">{[0,1,2,3,4].map(n=><div key={n} className="tower-floor"><span>F{n}</span><i/><i/><i/></div>)}</div><div className="tower-base"/></div>
          <div className="occupancy-hero-copy"><span className="eyebrow">MAIN BUILDING · VINOBA NAGAR</span><h2>Every bed has a place.</h2><p>One visual map for rooms, rates, residents and live occupancy.</p><div className="occupancy-kpis"><div><b>{totalRooms}</b><span>Rooms</span></div><div><b>{capacity}</b><span>Capacity</span></div><div><b>{occupiedBeds}</b><span>Occupied</span></div><div><b>{availableBeds}</b><span>Available</span></div></div></div>
        </div>
        <div className="admin-card floor-toolbar"><div className="floor-building-tabs">{buildings.map(b=><button key={b.id} className={b.id===building?.id?"active":""} onClick={()=>setActiveBuilding(b.id)}><Building2 size={15}/>{b.name}</button>)}</div><label className="admin-search"><Users size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search room number or resident…"/></label><div className="floor-summary"><span><b>{occupiedBeds}</b> staying</span><span><b>{availableBeds}</b> free</span></div></div>
        {busy?<div className="admin-card empty-state">Loading floor occupancy…</div>:!building?<div className="admin-card empty-state">No building found. Apply the real room configuration migration.</div>:<div className="floor-list">{floors.map((f,fi)=><motion.section initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:fi*.05}} className="admin-card floor-section" key={f.id}><div className="floor-heading"><div><span>LEVEL {f.sort_order}</span><h2>{f.name}</h2></div><span className="floor-room-count">{f.rooms.length} rooms</span></div><div className="room-grid">{f.rooms.map(room=><motion.article whileHover={{y:-4}} transition={{duration:.18}} className="room-occupancy-card" key={room.id}><div className="room-card-head"><div><b>Room {room.room_number}</b><small>{room.room_type} · capacity {room.capacity} · ₹{Number(room.monthly_rate||0).toLocaleString("en-IN")}/month</small></div><span className={"room-status "+room.status}>{room.status.replaceAll("_"," ")}</span></div><div className="bed-list">{room.beds.map(bed=><div className={"bed-row "+(bed.resident?"occupied":"free")} key={bed.id}><div className="bed-icon"><BedDouble size={16}/></div>{bed.resident?<><div className="resident-photo">{bed.resident.photo_url?<img src={bed.resident.photo_url} alt="" />:<span>{bed.resident.full_name.split(" ").map(x=>x[0]).slice(0,2).join("")}</span>}</div><div className="resident-meta"><b>{bed.resident.full_name}</b><small>{bed.resident.member_code||"Resident"}{bed.resident.phone?" · "+bed.resident.phone:""}</small></div><button className="bed-action checkout" onClick={()=>void release(bed)} title="Check out resident"><X size={13}/></button></>:<><div className="resident-photo empty"><UserRound size={14}/></div><div className="resident-meta"><b>Available bed</b><small>{bed.bed_label}</small></div><button className="bed-action assign" onClick={async()=>{await loadResidents();setAllocationBed(bed)}} title="Allocate resident"><Check size={13}/></button></>}<span className="bed-label">{bed.bed_label}</span></div>)}</div></motion.article>)}</div></motion.section>)}{!floors.length&&<div className="admin-card empty-state">No matching rooms or residents found.</div>}</div>}
      </div>
    </section>
    {allocationBed&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAllocationBed(null)}}><motion.div initial={{opacity:0,scale:.96,y:12}} animate={{opacity:1,scale:1,y:0}} className="modal-card"><div className="modal-head"><div><span>ALLOCATE BED</span><h2>Room {buildings.flatMap(b=>b.floors.flatMap(f=>f.rooms)).find(r=>r.beds.some(b=>b.id===allocationBed.id))?.room_number}</h2></div><button className="icon-button" onClick={()=>setAllocationBed(null)}><X size={15}/></button></div><label className="admin-field"><span>Resident</span><select value={residentId} onChange={e=>setResidentId(e.target.value)}><option value="">Select resident</option>{residents.filter(r=>r.id).map(r=><option value={r.id} key={r.id}>{r.full_name}{r.member_code?" · "+r.member_code:""}</option>)}</select></label><label className="admin-field"><span>Check-in date</span><input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)}/></label><div className="modal-actions"><button className="button ghost" onClick={()=>setAllocationBed(null)}>Cancel</button><button className="button primary" disabled={!residentId||allocating} onClick={()=>void allocate()}>{allocating?"Allocating…":"Allocate resident"} <Check size={15}/></button></div></motion.div></div>}
  </main>
}
