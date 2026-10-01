"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
export default function StartChallenge({assigned=false,completed=false,allCompleted=false}:{assigned?:boolean;completed?:boolean;allCompleted?:boolean}) {
 const router=useRouter(),pending=useRef(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[finished,setFinished]=useState(false);
 async function start(){
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try {
   const response=await fetch(completed?'/api/challenges/next':'/api/challenges/start',{method:'POST'});
   const data=await response.json() as {error?:string;assignedChallenge:{id:string}|null;allChallengesCompleted:boolean};
   if(response.status===401){router.replace('/login');return;}
   if(!response.ok){setError(data.error??'Unable to assign challenge.');return;}
   if(data.allChallengesCompleted){setFinished(true);router.refresh();return;}
   if(!data.assignedChallenge){setError('No eligible challenges are published yet. Please check back soon.');return;}
   router.push('/challenges/'+encodeURIComponent(data.assignedChallenge.id));router.refresh();
  }catch{setError('Unable to start the challenge. Please try again.');}
  finally{pending.current=false;setBusy(false);}
 }
 if(allCompleted||finished)return <p role="status">ALL CHALLENGES COMPLETED</p>;
 return <div><button className="register arena-start" onClick={start} disabled={busy}>{busy?'ASSIGNING…':assigned?'CONTINUE CHALLENGE':completed?'NEXT CHALLENGE':'START CHALLENGE'}<ArrowRight aria-hidden="true"/></button>{error&&<p role="alert" className="arena-inline-error">{error}</p>}</div>;
}
