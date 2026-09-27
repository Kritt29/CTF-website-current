import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParticipantPage } from "@/lib/server/auth";
import { assignment } from "@/lib/server/competition";
export default async function ChallengePage({params}:{params:Promise<{challengeId:string}>}) {
 const user=await requireParticipantPage();const {challengeId}=await params;const challenge=await assignment(user.id);if(!challenge||challenge.id!==challengeId)notFound();
 return <section className="arena-route"><p className="arena-kicker">{challenge.challengeCode} / {challenge.category} / {challenge.difficulty}</p><h1>{challenge.title}</h1><div className="arena-panel arena-challenge-placeholder"><h2>ASSIGNED TO YOU</h2><p>{challenge.description}</p><p>Your assignment and start time are saved. The isolated challenge environment and flag-submission system are not implemented in this release.</p><Link href="/challenges">← Back to challenges</Link></div></section>;
}
