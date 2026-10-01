import "server-only";
import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import { requireParticipant, requireParticipantPage, digest } from "./auth";
import { assignment } from "./competition";
import { database } from "./database";
import { ApiError } from "./http";

export async function requireWeb102(request?:Request) {
 const user=request?await requireParticipant(request):await requireParticipantPage();
 if((await assignment(user.id,"WEB-102"))?.challengeCode!=='WEB-102') {
  if(!request)notFound();
  throw new ApiError(403,'This challenge is not assigned to you.');
 }
 return user;
}

// Stable SHA-256-derived Mulberry32 stream; versioning this changes existing puzzles.
export async function web102Config(participantId:string) {
 const seed=await digest(participantId+'|WEB-102|v1');let state=parseInt(seed.slice(0,8),16);
 const next=()=>{state=(state+0x6D2B79F5)|0;let n=Math.imul(state^(state>>>15),1|state);n^=n+Math.imul(n^(n>>>7),61|n);return ((n^(n>>>14))>>>0)/4294967296;};
 const hex=()=>Math.floor(next()*65536).toString(16).padStart(4,'0');
 const pick=(values:string[])=>values[Math.floor(next()*values.length)];
 const nonce=hex(),fragment=hex(),prefix='ddc_web102_'+seed.slice(0,8)+'_';
 const profileKey=prefix+pick(['profile_blob','access_profile','client_profile']);
 const checkpointKey=prefix+pick(['checkpoint','trust_state','session_verified']);
 const zoneKey=prefix+pick(['zone','clearance','security_band']);
 const zone=pick(['internal','operations','restricted']);
 const decoys=[['admin','false'],['root','false'],['debug','false'],['authorized','false'],['premium','false'],['beta','0'],['theme','dark'],['portal_version',String(2+Math.floor(next()*4))],['last_visit','legacy-'+hex()]];
 for(let i=decoys.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[decoys[i],decoys[j]]=[decoys[j],decoys[i]];}
 return {incident:'DDC-'+fragment.toUpperCase(),nonce,fragment,prefix,profileKey,checkpointKey,zoneKey,zone,decoys:decoys.map(([key,value])=>[prefix+key,value]),stale:'OLD_'+hex().toUpperCase(),vault:'vault/'+nonce+'/'+fragment};
}
export type Web102Config=Awaited<ReturnType<typeof web102Config>>;

export async function evaluateWeb102(userId:string,config:Web102Config,body:unknown,request:Request) {
 if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError(400,'Malformed portal state.');
 const {profile,checkpoint}=body as {profile?:unknown;checkpoint?:unknown};
 if(typeof profile!=='string'||profile.length>2048||typeof checkpoint!=='string'||checkpoint.length>128)throw new ApiError(400,'Malformed portal state.');
 let decoded: {tier?:string;nonce?:string;features?:unknown} | null=null;
 try {decoded=JSON.parse(atob(profile));} catch { /* Invalid encoded profiles remain denied. */ }
 let stage=decoded?.tier==='ops'&&decoded.nonce===config.nonce&&Array.isArray(decoded.features)&&decoded.features.includes('reports')?1:0;
 if(stage===1&&checkpoint===`CHK_${config.nonce.toUpperCase()}_${config.fragment.toUpperCase()}`)stage=2;
 const zone=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(config.zoneKey+'='))?.slice(config.zoneKey.length+1);
 if(stage===2&&zone===config.zone)stage=3;
 await database().prepare('INSERT INTO web102_progress(user_id,stage,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET stage=excluded.stage,updated_at=excluded.updated_at').bind(userId,stage,Date.now()).run();
 return {stage,...(stage===3?{route:'/challenge-env/web-102/'+config.vault}:{})};
}
export async function web102VaultAllowed(userId:string,config:Web102Config,path:string) {
 if(path!==config.vault)return false;
 return !!await database().prepare('SELECT 1 FROM web102_progress WHERE user_id=? AND stage=3').bind(userId).first();
}
export async function resetWeb102(userId:string) {
 await database().prepare('DELETE FROM web102_progress WHERE user_id=?').bind(userId).run();
}
export function web102Flag() {
 const value=env.WEB102_FLAG;
 if(!value||value.includes('REPLACE_')||value==='DDC{client_state_is_a_trust_fall}'||!/^DDC\{[^\r\n{}]+\}$/.test(value))throw new ApiError(503,'Challenge vault is awaiting configuration. Contact an organizer.');
 return value;
}
