"use client";

import { motion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, BedDouble, BellRing, Building2, CalendarDays,
  CheckCircle2, ChevronRight, CircleDollarSign, FileCheck2, KeyRound,
  MessageSquareWarning, ShieldCheck, Sparkles, UsersRound, Wifi, Utensils,
  Dumbbell, BookOpen, WashingMachine
} from "lucide-react";
import Link from "next/link";\nimport type { LucideIcon } from "lucide-react";

const facilities: Array<[LucideIcon, string, string, string]> = [
  [Wifi, "High-speed Wi-Fi", "Connected study and living spaces", "cyan"],
  [ShieldCheck, "Secure living", "Resident-first access and safety", "violet"],
  [BookOpen, "Study spaces", "Quiet areas built for focus", "blue"],
  [Utensils, "Dining support", "Convenient everyday meal access", "orange"],
  [WashingMachine, "Laundry", "Simple, organized laundry workflow", "pink"],
  [Dumbbell, "Lifestyle", "Comfort beyond just a bed", "emerald"],
];

const steps: Array<[string, string, LucideIcon, string]> = [
  ["01", "Apply online", FileCheck2, "Complete your admission details from any device."],
  ["02", "Get verified", BadgeCheck, "Documents and application status stay organized."],
  ["03", "Choose your stay", KeyRound, "Room and bed allocation is managed centrally."],
  ["04", "Move in", Building2, "Check-in, payments and resident records go digital."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="brand-orb grid size-11 place-items-center rounded-2xl">
            <Building2 className="size-5 text-white" />
          </div>
          <div>
            <div className="font-bold tracking-tight">JAY BOYS</div>
            <div className="text-[10px] font-medium uppercase tracking-[.24em] text-slate-400">Hostel · Indore</div>
          </div>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a href="#rooms" className="nav-link">Rooms</a>
          <a href="#facilities" className="nav-link">Facilities</a>
          <a href="#process" className="nav-link">Admission</a>
          <a href="#app" className="nav-link">Resident App</a>
        </div>
        <Link href="/login" className="premium-button secondary">Member Login <ChevronRight className="size-4" /></Link>
      </nav>

      <section className="relative z-10 px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="eyebrow">
              <Sparkles className="size-3.5" /> A smarter way to live
            </motion.div>
            <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.08}} className="hero-title">
              Your hostel.
              <span> Your space.</span>
              <strong> Your experience.</strong>
            </motion.h1>
            <p className="hero-copy">
              A vibrant digital hostel experience for admissions, rooms, payments, documents,
              announcements and resident support — designed around everyday student life.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/apply" className="premium-button primary">Apply for Admission <ArrowRight className="size-4" /></Link>
              <a href="#rooms" className="premium-button secondary">Explore the hostel</a>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              {[
                [ShieldCheck, "Secure access"], [Wifi, "Fast Wi-Fi"], [BellRing, "Smart alerts"], [CircleDollarSign, "Digital fees"]
              ].map(([Icon,label]) => {
                const C = Icon as LucideIcon;
                return <div key={label as string} className="mini-pill"><C className="size-4 text-cyan-300"/>{label as string}</div>
              })}
            </div>
          </div>

          <motion.div initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} transition={{duration:.8,ease:"easeOut"}} className="relative">
            <div className="hero-3d-card">
              <div className="floating-chip chip-one"><BedDouble className="size-4"/> Beds ready</div>
              <div className="floating-chip chip-two"><Wifi className="size-4"/> Wi-Fi connected</div>
              <img src="/hostel-3d.svg" alt="3D illustration of Jay Boys Hostel" className="hostel-3d" />
              <div className="hero-console">
                <div>
                  <div className="text-xs uppercase tracking-[.18em] text-slate-400">Digital residence</div>
                  <div className="mt-1 text-xl font-bold">Everything in one place</div>
                </div>
                <div className="live-dot"><span /> Live experience</div>
              </div>
            </div>
            <div className="orb orb-a" /><div className="orb orb-b" />
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [UsersRound,"Resident-first","Digital member experience"],
            [BedDouble,"Room + bed","Allocation ready"],
            [CalendarDays,"Stay timeline","Dates & reminders"],
            [ShieldCheck,"Protected","Role-based operations"]
          ].map(([Icon,title,desc],i)=>{
            const C=Icon as LucideIcon;
            return <motion.div whileHover={{y:-5}} key={title as string} className="stat-card">
              <div className="icon-tile"><C className="size-5"/></div><div className="mt-4 font-bold">{title as string}</div><div className="mt-1 text-xs text-slate-400">{desc as string}</div>
            </motion.div>
          })}
        </div>
      </section>

      <section id="rooms" className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="section-heading"><div className="section-kicker">STAY YOUR WAY</div><h2>Rooms designed for real student life.</h2><p>Flexible room and bed management gives residents clarity while keeping hostel operations organized.</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ["02","Twin comfort","Two-sharing experience","violet",BedDouble],
            ["03","Balanced living","Three-sharing experience","cyan",UsersRound],
            ["04","Social stay","Four-sharing experience","orange",UsersRound]
          ].map(([number,title,desc,color,Icon])=>{
            const C=Icon as LucideIcon;
            return <motion.div whileHover={{y:-8,rotateX:2}} key={title as string} className={"room-card "+color}>
              <div className="room-number">{number}</div><div className="room-icon"><C className="size-7"/></div>
              <h3>{title as string}</h3><p>{desc as string}</p>
              <div className="mt-7 flex items-center justify-between text-xs text-slate-400"><span>Configurable in admin</span><ArrowRight className="size-4"/></div>
            </motion.div>
          })}
        </div>
      </section>

      <section id="facilities" className="relative z-10 border-y border-white/5 bg-white/[.025] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="section-heading"><div className="section-kicker">HOSTEL LIFE</div><h2>More than a room key.</h2><p>A colourful, comfortable experience that keeps the practical things simple.</p></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map(([Icon,title,desc,color])=>{
              const C=Icon as LucideIcon;
              return <motion.div whileHover={{scale:1.02,y:-4}} key={title as string} className={"facility-card "+color}><div className="facility-icon"><C className="size-6"/></div><h3>{title as string}</h3><p>{desc as string}</p></motion.div>
            })}
          </div>
        </div>
      </section>

      <section id="app" className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="app-showcase">
          <div className="max-w-xl">
            <div className="section-kicker">RESIDENT APP EXPERIENCE</div>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Your stay, at a glance.</h2>
            <p className="mt-5 leading-7 text-slate-300">Room details, upcoming payments, documents, announcements and support are organized into one focused resident portal.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[[BedDouble,"My room"],[CircleDollarSign,"Payments"],[FileCheck2,"Documents"],[MessageSquareWarning,"Support"]].map(([Icon,label])=>{const C=Icon as typeof BedDouble;return <div key={label as string} className="app-feature"><C className="size-5 text-cyan-300"/><span>{label as string}</span></div>})}
            </div>
          </div>
          <div className="phone-mockup">
            <div className="phone-notch"/>
            <div className="phone-screen">
              <div className="text-xs text-cyan-300">JAY BOYS HOSTEL</div><div className="mt-3 text-2xl font-black">Welcome back</div>
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-cyan-400/10 p-4"><div className="text-xs text-slate-400">MY ROOM</div><div className="mt-1 text-2xl font-bold">204 · Bed B</div><div className="mt-3 h-1.5 rounded-full bg-cyan-300/30"><div className="h-full w-3/4 rounded-full bg-cyan-300"/></div></div>
              <div className="mt-3 grid grid-cols-2 gap-3"><div className="phone-tile"><CircleDollarSign/><b>₹7,000</b><small>Next payment</small></div><div className="phone-tile"><BellRing/><b>03</b><small>Notifications</small></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="section-heading"><div className="section-kicker">SIMPLE ADMISSION</div><h2>From application to check-in.</h2></div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map(([num,title,Icon,desc])=>{const C=Icon as LucideIcon;return <motion.div whileHover={{y:-5}} key={num as string} className="step-card"><span>{num as string}</span><C className="mt-8 size-6 text-cyan-300"/><h3>{title as string}</h3><p>{desc as string}</p></motion.div>})}
        </div>
      </section>

      <section className="relative z-10 px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-cyan-400/10 p-8 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div><div className="section-kicker">READY TO MOVE?</div><h2 className="mt-2 text-3xl font-black sm:text-4xl">Start your Jay Boys Hostel application.</h2><p className="mt-3 max-w-xl text-slate-300">A modern admission journey built for residents and the team managing the hostel.</p></div>
            <Link href="/apply" className="premium-button primary whitespace-nowrap">Start Application <ArrowRight className="size-4"/></Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-slate-400 md:flex-row"><div><div className="font-bold text-white">JAY BOYS HOSTEL</div><div className="mt-1">Vinoba Nagar · Indore · Madhya Pradesh</div></div><div>Admissions · Resident Portal · Admin Command Center</div></div>
      </footer>
    </main>
  );
}
