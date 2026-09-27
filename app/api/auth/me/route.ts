import { api,json } from "@/lib/server/http";
import { requireParticipant } from "@/lib/server/auth";
import { eventConfig } from "@/lib/event";
export async function GET(request:Request){return api(async()=>json({participant:await requireParticipant(request),event:eventConfig}));}
