import { requireParticipantPage } from "@/lib/server/auth";
import ParticipantShell from "@/components/participant/ParticipantShell";
export const dynamic="force-dynamic";
// `source` is server-rendered outside the client-restored shell so it appears in View Page Source.
export default async function ParticipantLayout({children,source}:{children:React.ReactNode;source:React.ReactNode}) {await requireParticipantPage();return <><ParticipantShell>{children}</ParticipantShell>{source}</>;}
