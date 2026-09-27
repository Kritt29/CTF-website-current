import { api,json,sameOrigin } from "@/lib/server/http";
import { endSession,sessionCookie } from "@/lib/server/auth";
export async function POST(request:Request){return api(async()=>{sameOrigin(request);await endSession(request);return json({ok:true},200,{"Set-Cookie":sessionCookie("",request,true)});});}
