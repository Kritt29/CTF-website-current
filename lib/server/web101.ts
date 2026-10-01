import "server-only";
import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import { requireParticipant, requireParticipantPage } from "./auth";
import { assignment } from "./competition";
import { database } from "./database";
import { ApiError } from "./http";

export const WEB101_STAGES = ['index', 'archive/7f2c', 'ghost-terminal'];
export const WEB101_SOURCE_CLUE = '<!-- ghost_trace: check what the browser remembers -->';

export async function requireWeb101(request?: Request) {
  const user = request ? await requireParticipant(request) : await requireParticipantPage();
  const assigned = await assignment(user.id,"WEB-101");
  if (assigned?.challengeCode !== "WEB-101") {
    if (!request) notFound();
    throw new ApiError(403, "This challenge is not assigned to you.");
  }
  return user;
}

export async function markWeb101Archive(userId: string) {
  await database().prepare("INSERT INTO web101_progress(user_id,archive_reached_at) VALUES(?,?) ON CONFLICT(user_id) DO NOTHING").bind(userId, Date.now()).run();
}

// The terminal is unreachable until this participant has been served the archive.
export async function web101ArchiveReached(userId: string) {
  return !!await database().prepare("SELECT 1 AS reached FROM web101_progress WHERE user_id=?").bind(userId).first();
}

export function web101Flag() {
  const flag = env.WEB101_FLAG;
  if (!flag || flag.includes("REPLACE_WITH_PRIVATE_FLAG") || !/^DDC\{[^\r\n{}]+\}$/.test(flag)) {
    throw new ApiError(503, "Challenge terminal is awaiting configuration. Contact an organizer.");
  }
  return flag;
}
