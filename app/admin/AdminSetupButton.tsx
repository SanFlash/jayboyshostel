"use client";

import { useState } from "react";
import { Database, Loader2 } from "lucide-react";

export default function AdminSetupButton() {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function setup(){
    if(!window.confirm("Initialize Jay Boys Hostel with the default hostel, building, floor, rooms, beds, pricing and document types? Existing records will not be deleted.")) return;
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/setup",{method:"POST",credentials:"same-origin"});
      const payload=await response.json();
      if(!response.ok) throw new Error(payload.error||"Initialization failed.");
      setMessage(payload.created?.length ? "Workspace initialized." : "Workspace already initialized.");
      window.location.reload();
    }catch(error){setMessage(error instanceof Error?error.message:"Initialization failed.");}
    finally{setBusy(false);}
  }

  return <div className="admin-setup-action">
    <button className="button ghost" onClick={()=>void setup()} disabled={busy}>
      {busy?<Loader2 size={15} className="spin"/>:<Database size={15}/>}
      {busy?"Initializing…":"Initialize workspace"}
    </button>
    {message&&<small>{message}</small>}
  </div>;
}
