import { api,json,readJson,sameOrigin } from "@/lib/server/http";
import { requireWeb102,web102Config,web102VaultAllowed,web102Flag,evaluateWeb102,resetWeb102 } from "@/lib/server/web102";
import { portalDocument } from "@/lib/server/web102-document";
type Context={params:Promise<{path:string[]}>};
export async function GET(request:Request,{params}:Context) {
 return api(async()=>{
  const user=await requireWeb102(request),config=await web102Config(user.participantId),path=(await params).path.join('/');
  if(path!=='index'&&!await web102VaultAllowed(user.id,config,path))return json({error:'Record not found.'},404);
  const nonce=crypto.randomUUID().replaceAll('-','');
  return new Response(portalDocument(config,nonce,path==='index'?undefined:web102Flag()),{headers:{
   'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Referrer-Policy':'same-origin',
   'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'`,
  }});
 });
}
export async function POST(request:Request,{params}:Context) {
 return api(async()=>{
  const user=await requireWeb102(request);sameOrigin(request);const path=(await params).path.join('/');
  if(path==='reset'&&process.env.NODE_ENV!=='production'){await resetWeb102(user.id);return json({ok:true});}
  if(path!=='state')return json({error:'Record not found.'},404);
  return json(await evaluateWeb102(user.id,await web102Config(user.participantId),await readJson(request),request));
 });
}
