import { requireParticipantPage } from "@/lib/server/auth";
import SubmissionForm from "@/components/participant/SubmissionForm";
export default async function SubmissionsPage({searchParams}:{searchParams:Promise<{challenge?:string}>}) {
 await requireParticipantPage();const {challenge}=await searchParams;
 return <SubmissionForm key={typeof challenge==='string'?challenge:''} initialChallenge={typeof challenge==='string'?challenge.slice(0,64):''}/>;
}
