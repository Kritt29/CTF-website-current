import { api,json,sameOrigin } from "@/lib/server/http";
import { requireParticipant } from "@/lib/server/auth";
import { startChallenge } from "@/lib/server/competition";
export async function POST(request:Request){return api(async()=>{sameOrigin(request);const user=await requireParticipant(request);return json({assignedChallenge:await startChallenge(user.id)});});}
