import { Buffer } from "node:buffer";
import { createHash, timingSafeEqual } from "node:crypto";

// Pure staging check for CRYPTO-105 (no Worker bindings), shared by the server module and tests.
export type Crypto105Staged = {artifactVersion: string; archiveSha256: string; flagCommitment: string; archiveBase64: string};
export const CRYPTO105_ARTIFACT = "shift-change.zip";
const FLAG = /^DDC\{[A-Za-z0-9_]{19,91}\}$/;
const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest();

// Commitment binding the staged artifact to the configured flag.
export const crypto105Commitment = (flag: string) => sha256("DDC|CRYPTO-105|flag|" + flag).toString("hex");

// Returns the evidence only when the archive is intact and was generated for exactly this flag.
export function verifyCrypto105(staged: Crypto105Staged | null, flag: string | undefined) {
  if (!staged || typeof flag !== "string" || !FLAG.test(flag) || flag.includes("REPLACE_")) return null;
  const bytes = Buffer.from(staged.archiveBase64, "base64");
  const digest = sha256(bytes), commitment = sha256("DDC|CRYPTO-105|flag|" + flag);
  const expectedDigest = Buffer.from(staged.archiveSha256, "hex"), expectedCommitment = Buffer.from(staged.flagCommitment, "hex");
  if (expectedDigest.length !== 32 || expectedCommitment.length !== 32) return null;
  if (!timingSafeEqual(digest, expectedDigest) || !timingSafeEqual(commitment, expectedCommitment)) return null;
  return {flag, bytes: new Uint8Array(bytes), sha256: digest.toString("hex")};
}
