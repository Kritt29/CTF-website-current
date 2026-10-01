import { currentParticipant } from "@/lib/server/auth";
import { assignment } from "@/lib/server/competition";
import { WEB101_SOURCE_CLUE } from "@/lib/server/web101";
// WEB-101 stage 1: a genuine HTML comment in the top-level page source (Ctrl+U).
export default async function ChallengeSource({params}:{params:Promise<{challengeId:string}>}) {
 const {challengeId}=await params;const user=await currentParticipant();if(!user)return null;
 const assigned=await assignment(user.id,"WEB-101");
 if(assigned?.challengeCode!=='WEB-101'||(challengeId!=='WEB-101'&&challengeId!==assigned.id))return null;
 return <div hidden dangerouslySetInnerHTML={{__html:WEB101_SOURCE_CLUE}}/>;
}
