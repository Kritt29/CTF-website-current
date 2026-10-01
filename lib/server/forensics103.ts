import "server-only";
import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import { requireParticipant, requireParticipantPage } from "./auth";
import { assignment } from "./competition";
import { ApiError } from "./http";
import { buildForensics103 } from "../forensics103/artifact";

export async function requireForensics103(request?: Request) {
  const user = request ? await requireParticipant(request) : await requireParticipantPage();
  if ((await assignment(user.id, "FORENSICS-103"))?.challengeCode !== "FORENSICS-103") {
    if (!request) notFound();
    throw new ApiError(403, "This challenge is not assigned to you.");
  }
  return user;
}

export function forensics103Flag() {
  const flag = env.FORENSICS103_FLAG;
  if (!flag || flag.includes("REPLACE_") || !/^DDC\{[^\r\n{}]{1,100}\}$/.test(flag)) {
    throw new ApiError(503, "Evidence is awaiting configuration. Contact an organizer.");
  }
  return flag;
}

// The evidence image is derived from the secret on demand; nothing flag-bearing is stored in the repo or bundle.
let cached: {flag: string; bytes: Uint8Array<ArrayBuffer>; sha256: string} | null = null;
export async function forensics103Evidence() {
  const flag = forensics103Flag();
  if (cached?.flag !== flag) {
    const bytes = buildForensics103(flag).bytes as Uint8Array<ArrayBuffer>;
    const sha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(v => v.toString(16).padStart(2, "0")).join("");
    cached = {flag, bytes, sha256};
  }
  return cached;
}
