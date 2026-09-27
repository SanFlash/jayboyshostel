"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BedDouble, Building2, RefreshCw, UserRound, Users } from "lucide-react";

type Resident={id:string;member_code?:string;full_name:string;phone?:string;photo_url?:string|null};
type Bed={id:string;bed_label:string;status:string;resident?:Resident|null;tenancy?:{status:string;check_in_date:string;expected_checkout_date?:string|null}|null};
type Room={id:string;room_number:string;room_type:string;capacity:number;status:string;beds:Bed[]};
type Floor={id:string;name:string;rooms:Room[]};
type Building={id:string;name:string;floors:Floor[]};

export default function FloorOccupancyPage(){
  const [buildings,setBuildings]=useState<Building[]>([]);
  const [busy,setBusy]=useState(true); const [error,setError]=useState("");
  const [activeBuilding,setActiveBuilding]=useState("");
  const [query,setQuery]=useState("");

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
  useEffect(()=>{void load()},[]);
  const building=buildings.find(b=>b.id===activeBuilding) || buildings[0];
  const q=query.trim().toLowerCase();
  const floors=useMemo(() => {
    if (!building) return [];
    return building.floors
      .map((floor) => ({
        ...floor,
        rooms: floor.rooms.filter((room) =>
          !q ||
          room.room_number.toLowerCase().includes(q) ||
          room.beds.some((bed) => bed.resident?.full_name.toLowerCase().includes(q))
        ),
      }))
      .filter((floor) => floor.rooms.length > 0);
  }, [building, q]);
  const totalRooms=building?.floors.reduce((n,f)=>n+f.rooms.length,0)||0;
  const occupiedBeds=building?.floors.reduce((n,f)=>n+f.rooms.reduce((x,r)=>x+r.beds.filter(b=>b.resident).length,0),0)||0;

  return <main className="admin-app">
    <aside className="admin-sidebar">
      <Link href="/admin" prefetch={false} className="admin-brand"><span className="brand-mark"><Building2 size={18}/></span><span><b>JAY BOYS</b><small>OPERATIONS OS</small></span></Link>
      <div className="admin-nav"><div className="admin-nav-group"><span>COMMAND</span><Link href="/admin" prefetch={false}>Overview</Link><Link className="active" href="/admin/floor-map" prefetch={false}>Floor Occupancy</Link><Link href="/admin/members" prefetch={false}>Residents</Link><Link href="/admin/tenancies" prefetch={false}>Stay & Allocations</Link></div><div className="admin-nav-group"><span>HOSTEL</span><Link href="/admin/buildings" prefetch={false}>Buildings</Link><Link href="/admin/floors" prefetch={false}>Floors</Link><Link href="/admin/rooms" prefetch={false}>Rooms</Link><Link href="/admin/beds" prefetch={false}>Beds</Link></div></div>
      <div className="admin-sidebar-foot"><Link href="/api/auth/signout" prefetch={false}>Sign out</Link><Link href="/" prefetch={false}>View website</Link></div>
    </aside>
    <section className="admin-main"><header className="admin-mobile-head"><Link href="/admin" className="brand"><span className="brand-mark"><Building2 size={17}/></span><span><b>JAY BOYS</b><small>FLOORS</small></span></Link></header>
      <div className="admin-content">
        <div className="admin-breadcrumb"><Link href="/admin" prefetch={false}><ArrowLeft size={14}/> Dashboard</Link><span>/</span><b>Floor occupancy</b></div>
        <div className="admin-page-head"><div><div className="eyebrow"><Building2 size={14}/> HOSTEL / LIVE OCCUPANCY</div><h1>Floor & room view.</h1><p>See every floor, room, bed and current resident in one operational map, including resident photos when uploaded.</p></div><button className="button ghost" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Refresh</button></div>
        {error&&<div className="admin-error">{error}</div>}
        <div className="admin-card floor-toolbar">
          <div className="floor-building-tabs">{buildings.map(b=><button key={b.id} className={b.id===building?.id?"active":""} onClick={()=>setActiveBuilding(b.id)}><Building2 size={15}/>{b.name}</button>)}</div>
          <label className="admin-search"><Users size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search room number or resident…"/></label>
          <div className="floor-summary"><span><b>{totalRooms}</b> rooms</span><span><b>{occupiedBeds}</b> residents staying</span></div>
        </div>
        {busy?<div className="admin-card empty-state">Loading floor occupancy…</div>:!building?<div className="admin-card empty-state">No buildings found. Initialize the hostel workspace first.</div>:<div className="floor-list">{floors.map(f=><section className="admin-card floor-section" key={f.id}><div className="floor-heading"><div><span>FLOOR</span><h2>{f.name}</h2></div><span className="floor-room-count">{f.rooms.length} rooms</span></div><div className="room-grid">{f.rooms.map(room=><article className="room-occupancy-card" key={room.id}><div className="room-card-head"><div><b>Room {room.room_number}</b><small>{room.room_type} · capacity {room.capacity}</small></div><span className={"room-status "+room.status}>{room.status.replaceAll("_"," ")}</span></div><div className="bed-list">{room.beds.map(bed=><div className={"bed-row "+(bed.resident?"occupied":"free")} key={bed.id}><div className="bed-icon"><BedDouble size={16}/></div>{bed.resident?<><div className="resident-photo">{bed.resident.photo_url?<img src={bed.resident.photo_url} alt={bed.resident.full_name}/>:<span>{bed.resident.full_name.split(" ").map(x=>x[0]).slice(0,2).join("")}</span>}</div><div className="resident-meta"><b>{bed.resident.full_name}</b><small>{bed.resident.member_code||"Resident"}{bed.resident.phone?" · "+bed.resident.phone:""}</small></div></>:<div className="resident-meta"><b>Available bed</b><small>{bed.bed_label} · {bed.status}</small></div>}<span className="bed-label">{bed.bed_label}</span></div>)}</div></article>)}</div></section>)}{!floors.length&&<div className="admin-card empty-state">No matching rooms or residents found.</div>}</div>}
      </div>
    </section>
  </main>
}
