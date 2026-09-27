"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
export default function StartChallenge({assigned=false}:{assigned?:boolean}) {
 const router=useRouter();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function start(){if(busy)return;setBusy(true);setError('');try{const response=await fetch('/api/challenges/start',{method:'POST'});const data=await response.json() as {error:string;assignedChallenge:{id:string}};if(response.status===401){router.replace('/login');return;}if(!response.ok){setError(data.error);return;}router.push('/challenges/'+encodeURIComponent(data.assignedChallenge.id));}catch{setError('Unable to start the challenge. Please try again.');}finally{setBusy(false);}}
 return <div><button className="register arena-start" onClick={start} disabled={busy}>{busy?'ASSIGNING…':assigned?'CONTINUE CHALLENGE':'START CHALLENGE'}<ArrowRight aria-hidden="true"/></button>{error&&<p role="alert" className="arena-inline-error">{error}</p>}</div>;
}

