"use client";
import { useEffect,useRef,useState,type FormEvent } from "react";
import { useRouter } from "next/navigation";
import './submissions.css';
import StartChallenge from './StartChallenge';
type Attempt={id:string;challengeId:string;result:string;submittedAt:number};
export default function SubmissionForm({initialChallenge}:{initialChallenge:string}) {
 const router=useRouter(),pending=useRef(false);
 const [challenge,setChallenge]=useState(initialChallenge),[flag,setFlag]=useState(''),[busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState(''),[correct,setCorrect]=useState(false),[history,setHistory]=useState<Attempt[]>([]),[historyError,setHistoryError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController();fetch('/api/submissions',{cache:'no-store',signal:controller.signal}).then(async response=>{if(response.status===401){router.replace('/login');return;}if(!response.ok)throw new Error();const data=await response.json() as {submissions:Attempt[]};setHistory(data.submissions);}).catch(()=>{if(!controller.signal.aborted)setHistoryError('Unable to load attempts. Reload to retry.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[router]);
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setFeedback('');
  try {
   const response=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({challengeId:challenge,flag})});
   const data=await response.json() as {correct?:boolean;message?:string;error?:string};
   if(response.status===401){router.replace('/login');return;}
   setCorrect(response.ok&&data.correct===true);setFeedback(data.message??data.error??'Unable to submit. Please try again.');
   if(response.ok){setFlag('');const recent=await fetch('/api/submissions',{cache:'no-store'});if(!recent.ok)throw new Error('history');const data=await recent.json() as {submissions:Attempt[]};setHistory(data.submissions);setHistoryError('');}
  } catch {setHistoryError('Connection interrupted. Reload your attempts before retrying.');}
  finally {pending.current=false;setBusy(false);}
 }
 return <section className="arena-route submission-page"><p className="arena-kicker">VERIFY YOUR DISCOVERY</p><h1>SUBMIT FLAG</h1>
  <form className="arena-panel submission-form" method="post" action="/api/submissions" onSubmit={submit}>
   <label htmlFor="submission-challenge">Challenge ID</label><input id="submission-challenge" name="challengeId" placeholder="WEB-101" required maxLength={64} value={challenge} onChange={e=>setChallenge(e.target.value)} autoComplete="off" spellCheck={false}/>
   <label htmlFor="submission-flag">Flag</label><input id="submission-flag" name="flag" placeholder="DDC{...}" required maxLength={512} value={flag} onChange={e=>setFlag(e.target.value)} autoComplete="off" spellCheck={false} autoCapitalize="none"/>
   <button type="submit" className="register arena-start" disabled={busy} aria-busy={busy}>{busy?'VALIDATING…':'SUBMIT FLAG →'}</button>
   <p role="status" aria-live="polite" className={correct?'submission-success':'arena-inline-error'}>{feedback}</p>
  </form>
  {correct&&<StartChallenge completed/>}
  <section className="arena-panel submission-history"><div className="arena-panel-heading"><h3>YOUR RECENT ATTEMPTS</h3><small>LATEST 50</small></div>
   {historyError&&<p role="alert" className="arena-inline-error">{historyError}</p>}
   {loading?<p role="status">Loading attempts…</p>:history.length?<div className="submission-table"><table><thead><tr><th>Challenge</th><th>Result</th><th>Submitted</th></tr></thead><tbody>{history.map(attempt=><tr key={attempt.id}><td>{attempt.challengeId}</td><td className={attempt.result==='CORRECT'?'submission-success':'submission-wrong'}>{attempt.result}</td><td><time dateTime={new Date(attempt.submittedAt).toISOString()}>{new Date(attempt.submittedAt).toLocaleString()}</time></td></tr>)}</tbody></table></div>:<p className="arena-empty">No attempts recorded yet.</p>}
  </section></section>;
}
