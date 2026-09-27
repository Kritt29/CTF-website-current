"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserRound, ChevronDown, LogOut } from "lucide-react";
import type { Participant, EventInfo } from "@/lib/participant/types";
import EventClock from "./EventClock";
import "./participant.css";
const AuthContext=createContext<{participant:Participant;event:EventInfo}|null>(null);
export function useParticipant(){const value=useContext(AuthContext);if(!value)throw new Error('Participant shell required');return value;}
const routes=[['Dashboard','/dashboard'],['Challenges','/challenges'],['Submissions','/submissions'],['Leaderboard','/leaderboard'],['Rules','/rules']];
export default function ParticipantShell({children}:{children:ReactNode}) {
 const pathname=usePathname(),router=useRouter();
 const [auth,setAuth]=useState<{participant:Participant;event:EventInfo}|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  const restore=async()=>{try{const response=await fetch('/api/auth/me',{cache:'no-store',signal:controller.signal});if(response.status===401){setAuth(null);router.replace('/login');return;}if(!response.ok)throw new Error();setAuth(await response.json());setError('');}catch{if(!controller.signal.aborted)setError('Unable to restore your session. Reload to try again.');}};
  void restore();const visible=()=>{if(!document.hidden)void restore();};document.addEventListener('visibilitychange',visible);
  return()=>{controller.abort();document.removeEventListener('visibilitychange',visible);};
 },[pathname,router]);
 async function logout(){setBusy(true);try{const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw new Error();setAuth(null);router.replace('/login');}catch{setError('Logout failed. Please try again.');}finally{setBusy(false);}}
 return <div className="arena-app">
  <header className="arena-topbar" data-participant-topbar>
   <Link href="/dashboard" className="arena-brand"><img src="/assets/ddc-logo-reference.png" width="64" height="62" alt="DDC"/><span>DIGITAL DEFENCE CLUB<small>CBIT · DDC CTF</small></span></Link>
   <nav aria-label="Participant navigation">{routes.map(([label,href])=><Link key={href} href={href} aria-current={pathname===href||href==='/challenges'&&pathname.startsWith('/challenges/')?'page':undefined}>{label}</Link>)}</nav>
   {auth&&<><EventClock event={auth.event}/><details className="arena-profile"><summary><UserRound/><span>{auth.participant.displayName}<small>#{auth.participant.participantId}</small></span><ChevronDown/></summary><div><p>{auth.participant.email}</p><button type="button" onClick={logout} disabled={busy}><LogOut size={16}/>{busy?'Signing out…':'Log out'}</button><Link href="/">Public website ↗</Link></div></details></>}
  </header>
  {error&&<p className="arena-error" role="alert">{error}</p>}
  {auth?<AuthContext.Provider value={auth}><main className="arena-main">{children}</main></AuthContext.Provider>:<main className="arena-main"><p role="status">Restoring your session…</p></main>}
 </div>;
}

