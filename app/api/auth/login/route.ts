import { api,json,readJson,sameOrigin } from "@/lib/server/http";
import { authenticate,sessionCookie } from "@/lib/server/auth";
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const body=await readJson(request);const {participant,token}=await authenticate(body?.identifier??body?.username,body?.password,request);return json({participant},200,{"Set-Cookie":sessionCookie(token,request)});});}
