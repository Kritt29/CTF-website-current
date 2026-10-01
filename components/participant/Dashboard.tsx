"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy,ChartNoAxesColumnIncreasing,Flag,Lightbulb,Clock3,Megaphone,Globe,Box,Layers,Workflow,Search,Radar,ArrowRight } from "lucide-react";
import { categories,type DashboardData } from "@/lib/participant/types";
import { useParticipant } from "./ParticipantShell";
import EventClock from "./EventClock";
import StartChallenge from "./StartChallenge";
const icons=[Globe,Box,Layers,Workflow,Search,Radar];
export default function Dashboard() {
 const {participant}=useParticipant(),router=useRouter();const [data,setData]=useState<DashboardData|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('/api/dashboard',{cache:'no-store',signal:controller.signal}).then(async r=>{if(r.status===401){router.replace('/login');return;}if(!r.ok)throw new Error();setData(await r.json());}).catch(()=>{if(!controller.signal.aborted)setError('Dashboard unavailable. Please reload to retry.');});return()=>controller.abort();},[router]);
 return <>
  <section className="arena-welcome"><p>WELCOME BACK,</p><h1>{participant.displayName}</h1><h2>PARTICIPANT DASHBOARD</h2><span>— &nbsp; EXPLORE. ANALYZE. BREAK. LEARN.</span><aside>SAME<br/>CURIOSITY.<br/>HIGHER<br/>PRIVILEGES.<em>—</em></aside></section>
  {error&&<p role="alert" className="arena-error">{error}</p>}
  {!data?<p role="status">{error?'':'Loading your competition data…'}</p>:<div className="arena-dashboard-grid">
   <section className="arena-panel arena-assignment"><div className="arena-panel-heading"><h3>CURRENT CHALLENGE</h3><small>{data.assignedChallenge?'ASSIGNMENT SAVED':'SERVER ASSIGNED ON START'}</small></div><div className="arena-assignment-content"><img src="/assets/highlights/monolith.webp" width="280" height="205" alt="Orange-lit monolith in rocky terrain"/><div><h4>{data.assignedChallenge?.challengeCode??(data.solves?'CHALLENGE COMPLETED':'YOUR STARTING POINT')}</h4>{data.assignedChallenge&&<div className="arena-tags"><span>{data.assignedChallenge.category}</span><span>{data.assignedChallenge.difficulty}</span></div>}<p>{data.assignedChallenge?.description??(data.allChallengesCompleted?'Every published challenge is solved. Your results are saved.':data.solves?'Your solve is saved. Request your next challenge when you are ready.':'Start to receive your assigned challenge. Your starting point is selected by the server and saved for your next visit.')}</p><StartChallenge assigned={!!data.assignedChallenge} completed={data.solves>0} allCompleted={data.allChallengesCompleted}/></div></div></section>
   <section className="arena-stats" aria-label="Participant statistics">{[{label:'Score',value:data.score,Icon:Trophy},{label:'Rank',value:data.rank??'—',Icon:ChartNoAxesColumnIncreasing},{label:'Solves',value:`${data.solves}/${data.totalChallenges}`,Icon:Flag},{label:'Hints used',value:data.hintsUsed,Icon:Lightbulb}].map(({label,value,Icon})=><div className="arena-panel" key={label}><Icon aria-hidden="true"/><strong>{value}</strong><span>{label}</span></div>)}</section>
   <section className="arena-panel arena-event"><div className="arena-panel-heading"><h3>EVENT STATUS</h3></div><div className="arena-event-clock"><Clock3/><EventClock event={data.event}/></div><h4><Megaphone/>ANNOUNCEMENTS</h4>{data.announcements.length?<ul>{data.announcements.map(a=><li key={a.id}><time>{new Date(a.publishedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',timeZone:'Asia/Kolkata'})}</time><p>{a.body}</p></li>)}</ul>:<p className="arena-empty">No announcements published yet.</p>}</section>
   <section className="arena-panel arena-categories"><div className="arena-panel-heading"><h3>CHALLENGE CATEGORIES</h3><Link href="/challenges">EXPLORE ALL <ArrowRight size={13}/></Link></div><div className="arena-category-grid">{categories.map((category,i)=>{const Icon=icons[i];return <Link key={category} href={'/challenges?category='+category}><Icon aria-hidden="true"/><span>{category}</span></Link>;})}</div></section>
   <section className="arena-panel arena-activity"><div className="arena-panel-heading"><h3>RECENT ACTIVITY</h3><Link href="/submissions">VIEW ALL <ArrowRight size={13}/></Link></div>{data.recentActivity.length?<ul>{data.recentActivity.map(a=><li key={a.id}><i/><span>{a.type}<b>{a.challengeCode}</b></span><time>{new Date(a.at).toLocaleString()}</time></li>)}</ul>:<p className="arena-empty">No activity yet. Your recorded challenge activity will appear here.</p>}</section>
  </div>}
 </>;
}
