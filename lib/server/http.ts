import "server-only";
export class ApiError extends Error { constructor(public status:number,message:string) {super(message);} }
export function json(data:unknown,status=200,extra:HeadersInit={}) {
 const headers=new Headers(extra);headers.set("Cache-Control","no-store, private");headers.set("Vary","Cookie");
 return Response.json(data,{status,headers});
}
export async function api(work:()=>Promise<Response>) {
 try { return await work(); } catch(error) {
  if(error instanceof ApiError) return json({error:error.message},error.status);
  console.error("Participant request failed",error instanceof Error ? error.name : "UnknownError");
  return json({error:"The platform is temporarily unavailable. Please try again."},503);
 }
}
export function sameOrigin(request:Request) {
 if(request.headers.get("origin")!==new URL(request.url).origin || request.headers.get("sec-fetch-site")==="cross-site") throw new ApiError(403,"Request not allowed.");
}
export async function readJson(request:Request) {
 if(!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415,"Use JSON for this request.");
 const reader=request.body?.getReader(); if(!reader) throw new ApiError(400,"Invalid request.");
 let text="",size=0;const decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();throw new ApiError(413,"Request too large.");}text+=decoder.decode(value,{stream:true});}
 try{return JSON.parse(text+decoder.decode());}catch{throw new ApiError(400,"Invalid request.");}
}
