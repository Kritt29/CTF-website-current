import { api } from "@/lib/server/http";
import { crypto105Evidence, requireCrypto105 } from "@/lib/server/crypto105";
import { CRYPTO105_ARTIFACT } from "@/lib/server/crypto105-check";

export async function GET(request: Request) {
  return api(async () => {
    await requireCrypto105(request);
    const {bytes, sha256} = crypto105Evidence();
    return new Response(bytes, {headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${CRYPTO105_ARTIFACT}"`,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store, private',
      'Vary': 'Cookie',
      'X-Content-Type-Options': 'nosniff',
      'X-Evidence-SHA256': sha256,
    }});
  });
}
