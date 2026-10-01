import { api } from "@/lib/server/http";
import { forensics103Evidence, requireForensics103 } from "@/lib/server/forensics103";
import { FORENSICS103_ARTIFACT } from "@/lib/forensics103/artifact";

export async function GET(request: Request) {
  return api(async () => {
    await requireForensics103(request);
    const {bytes, sha256} = await forensics103Evidence();
    return new Response(bytes, {headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${FORENSICS103_ARTIFACT}"`,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store, private',
      'Vary': 'Cookie',
      'X-Content-Type-Options': 'nosniff',
      'X-Evidence-SHA256': sha256,
    }});
  });
}
