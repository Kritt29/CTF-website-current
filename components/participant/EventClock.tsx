"use client";
import { useEffect, useState } from "react";
import type { EventInfo } from "@/lib/participant/types";
export default function EventClock({event}:{event:EventInfo}) {
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{const tick=()=>setNow(Date.now());tick();const timer=setInterval(()=>{if(!document.hidden)tick();},1000);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick);};},[]);
 const started=now!==null&&now>=Date.parse(event.startsAt);
 const target=started?event.endsAt:event.startsAt;
 const remaining=now!==null&&target?Math.max(0,Math.floor((Date.parse(target)-now)/1000)):null;
 const label=!started?'CTF STARTS IN':event.endsAt?'CTF ENDS IN':'EVENT STARTED';
 const parts=remaining===null?null:[Math.floor(remaining/86400),Math.floor(remaining/3600)%24,Math.floor(remaining/60)%60,remaining%60];
 return <span className="arena-clock"><small>{label}</small><time aria-live="off">{parts?parts.map((n,i)=>`${String(n).padStart(2,'0')}${['D','H','M','S'][i]}`).join('  '):started?'End time TBA':'—'}</time></span>;
}
