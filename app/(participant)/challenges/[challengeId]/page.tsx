import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParticipantPage } from "@/lib/server/auth";
import { assignment,progression } from "@/lib/server/competition";
import StartChallenge from "@/components/participant/StartChallenge";
import GhostFrame from "@/components/participant/GhostFrame";
import PortalFrame from "@/components/participant/PortalFrame";
import EvidenceChallenge from "@/components/participant/EvidenceChallenge";
import DeadDropChallenge from "@/components/participant/DeadDropChallenge";
export default async function ChallengePage({params}:{params:Promise<{challengeId:string}>}) {
 const user=await requireParticipantPage();const {challengeId}=await params;const challenge=await assignment(user.id,challengeId);if(!challenge)notFound();
 if(challenge.solvedAt!==null){const state=await progression(user.id);return <section className="arena-route"><h1>{challenge.challengeCode}</h1><h2>CHALLENGE COMPLETED ✓</h2><StartChallenge assigned={!!state.assignedChallenge} completed allCompleted={state.allChallengesCompleted}/><Link href="/challenges">← Back to challenges</Link></section>;}
 if(challenge.challengeCode==='WEB-101') return <GhostFrame/>;
 if(challenge.challengeCode==='WEB-102') return <PortalFrame/>;
 if(challenge.challengeCode==='FORENSICS-103') return <EvidenceChallenge challenge={challenge}/>;
 if(challenge.challengeCode==='CRYPTO-104') return <DeadDropChallenge challenge={challenge}/>;
 return <section className="arena-route"><p className="arena-kicker">{challenge.challengeCode} / {challenge.category} / {challenge.difficulty}</p><h1>{challenge.title}</h1><div className="arena-panel arena-challenge-placeholder"><h2>ASSIGNED TO YOU</h2><p>{challenge.description}</p><p>Your assignment and start time are saved. The isolated challenge environment and flag-submission system are not implemented in this release.</p><Link href="/challenges">← Back to challenges</Link></div></section>;
}
