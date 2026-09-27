import { requireParticipantPage } from "@/lib/server/auth";
import Dashboard from "@/components/participant/Dashboard";
export default async function DashboardPage(){await requireParticipantPage();return <Dashboard/>;}
