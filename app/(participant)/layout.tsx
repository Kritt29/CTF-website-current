import { requireParticipantPage } from "@/lib/server/auth";
import ParticipantShell from "@/components/participant/ParticipantShell";
export const dynamic="force-dynamic";
export default async function ParticipantLayout({children}:{children:React.ReactNode}) {await requireParticipantPage();return <ParticipantShell>{children}</ParticipantShell>;}
