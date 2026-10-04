import "server-only";
import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import { requireParticipant, requireParticipantPage } from "./auth";
import { assignment } from "./competition";
import { ApiError } from "./http";
import { crypto105Staged } from "./generated/crypto105-evidence";
import { verifyCrypto105 } from "./crypto105-check";

export async function requireCrypto105(request?: Request) {
  const user = request ? await requireParticipant(request) : await requireParticipantPage();
  if ((await assignment(user.id, "CRYPTO-105"))?.challengeCode !== "CRYPTO-105") {
    if (!request) notFound();
    throw new ApiError(403, "This challenge is not assigned to you.");
  }
  return user;
}

// The evidence is an offline-built immutable ZIP; nothing here reconstructs the puzzle.
// A missing or invalid secret, missing evidence, or evidence staged for another flag fails closed.
let cached: ReturnType<typeof verifyCrypto105> = null;
export function crypto105Evidence() {
  const flag = env.CRYPTO105_FLAG;
  if (cached?.flag !== flag) cached = verifyCrypto105(crypto105Staged, flag);
  if (!cached) throw new ApiError(503, "Evidence is awaiting configuration. Contact an organizer.");
  return cached;
}

export const crypto105Flag = () => crypto105Evidence().flag;
