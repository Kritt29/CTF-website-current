import "server-only";
import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import { requireParticipant, requireParticipantPage } from "./auth";
import { assignment } from "./competition";
import { ApiError } from "./http";
import { crypto104Staged } from "./generated/crypto104-evidence";
import { verifyCrypto104 } from "./crypto104-check";

export async function requireCrypto104(request?: Request) {
  const user = request ? await requireParticipant(request) : await requireParticipantPage();
  if ((await assignment(user.id, "CRYPTO-104"))?.challengeCode !== "CRYPTO-104") {
    if (!request) notFound();
    throw new ApiError(403, "This challenge is not assigned to you.");
  }
  return user;
}

// The evidence is an offline-built immutable ZIP; nothing here reconstructs the puzzle.
// A missing or invalid secret, missing evidence, or evidence staged for another flag fails closed.
let cached: ReturnType<typeof verifyCrypto104> = null;
export function crypto104Evidence() {
  const flag = env.CRYPTO104_FLAG;
  if (cached?.flag !== flag) cached = verifyCrypto104(crypto104Staged, flag);
  if (!cached) throw new ApiError(503, "Evidence is awaiting configuration. Contact an organizer.");
  return cached;
}

export const crypto104Flag = () => crypto104Evidence().flag;
