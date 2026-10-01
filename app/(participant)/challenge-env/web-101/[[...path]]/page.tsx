import { notFound } from "next/navigation";
import { requireWeb101, web101ArchiveReached, WEB101_STAGES } from "@/lib/server/web101";
import GhostFrame from "@/components/participant/GhostFrame";
export default async function GhostEnvironment({params}: {params: Promise<{path?: string[]}>}) {
  const user = await requireWeb101();
  const stage = (await params).path?.join('/') || 'index';
  if (!WEB101_STAGES.includes(stage)) notFound();
  if (stage === 'ghost-terminal' && !await web101ArchiveReached(user.id)) notFound();
  return <GhostFrame stage={stage}/>;
}
