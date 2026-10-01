import { requireParticipant } from "@/lib/server/auth";
import { ApiError,api,json,readJson,sameOrigin } from "@/lib/server/http";
import { submissionHistory,submitFlag } from "@/lib/server/submissions";
export async function GET(request:Request) {
  return api(async()=>{const user=await requireParticipant(request);return json({submissions:await submissionHistory(user.id)});});
}
export async function POST(request:Request) {
  return api(async()=>{
    try {
      const user=await requireParticipant(request);sameOrigin(request);
      return json(await submitFlag(user.id,await readJson(request)));
    } catch(error) {
      if(error instanceof ApiError) return json({correct:false,message:error.message},error.status,error.status===429?{'Retry-After':'2'}:{});
      throw error;
    }
  });
}
