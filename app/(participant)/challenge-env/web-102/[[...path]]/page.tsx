import { notFound } from "next/navigation";
import PortalFrame from "@/components/participant/PortalFrame";
import { requireWeb102,web102Config,web102VaultAllowed } from "@/lib/server/web102";
export default async function PortalEnvironment({params}:{params:Promise<{path?:string[]}>}) {
 const user=await requireWeb102();const path=(await params).path?.join('/')||'index';
 if(path!=='index'&&!await web102VaultAllowed(user.id,await web102Config(user.participantId),path))notFound();
 return <PortalFrame stage={path}/>;
}
