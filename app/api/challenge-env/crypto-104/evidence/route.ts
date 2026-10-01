import { api } from "@/lib/server/http";
import { crypto104Evidence, requireCrypto104 } from "@/lib/server/crypto104";
import { CRYPTO104_ARTIFACT } from "@/lib/server/crypto104-check";

export async function GET(request: Request) {
  return api(async () => {
    await requireCrypto104(request);
    const {bytes, sha256} = crypto104Evidence();
    return new Response(bytes, {headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${CRYPTO104_ARTIFACT}"`,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store, private',
      'Vary': 'Cookie',
      'X-Content-Type-Options': 'nosniff',
      'X-Evidence-SHA256': sha256,
    }});
  });
}
