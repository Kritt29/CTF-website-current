import { api,json } from "@/lib/server/http";
import { requireParticipant } from "@/lib/server/auth";
import { dashboard } from "@/lib/server/competition";
export async function GET(request:Request){return api(async()=>json(await dashboard(await requireParticipant(request))));}
