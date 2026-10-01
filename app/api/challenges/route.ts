import { api,json } from "@/lib/server/http";
import { requireParticipant } from "@/lib/server/auth";
import { availableChallenges,progression } from "@/lib/server/competition";
export async function GET(request:Request){return api(async()=>{const user=await requireParticipant(request);return json({challenges:await availableChallenges(),...await progression(user.id)});});}
