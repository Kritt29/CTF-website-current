import { api, json } from "@/lib/server/http";
import { markWeb101Archive, requireWeb101, web101ArchiveReached, web101Flag, WEB101_STAGES } from "@/lib/server/web101";
import { ghostDocument } from "@/lib/server/web101-document";

export async function GET(request: Request, {params}: {params: Promise<{path: string[]}>}) {
  return api(async () => {
    const user = await requireWeb101(request);
    const stage = (await params).path.join('/');
    if (!WEB101_STAGES.includes(stage)) return json({error:'Record not found.'},404);
    if (stage === 'archive/7f2c') await markWeb101Archive(user.id);
    // Same response as an unknown record, so skipping the archive reveals nothing.
    if (stage === 'ghost-terminal' && !await web101ArchiveReached(user.id)) return json({error:'Record not found.'},404);
    const flag = stage === 'ghost-terminal' ? web101Flag() : undefined;
    const nonce = crypto.randomUUID().replaceAll('-','');
    return new Response(ghostDocument(stage,nonce,flag),{headers:{
      'Content-Type':'text/html; charset=utf-8',
      'Cache-Control':'no-store, private',
      'Vary':'Cookie',
      'X-Content-Type-Options':'nosniff',
      'X-Frame-Options':'SAMEORIGIN',
      'Referrer-Policy':'same-origin',
      'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'`,
      ...(stage === 'archive/7f2c' ? {'X-DDC-Trace':'/challenge-env/web-101/ghost-terminal'} : {}),
    }});
  });
}
