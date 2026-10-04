# CRYPTO-105 — Shift Change

Maintainer notes for setup and operations. This document deliberately omits the puzzle construction and solve path. The generator, reference solver, artifact tests and walkthrough are kept by organizers outside this repository and must never be committed here.

## What the platform does

CRYPTO-105 is a static evidence challenge (CRYPTO, MEDIUM, desktop-only) reached through NEXT CHALLENGE (`active=1`, `starting=0`, migration `0009_crypto105.sql`). Assigned participants download one immutable archive, `shift-change.zip`, and submit the recovered flag through the shared submission flow. Every participant receives byte-identical evidence. There is no live service and no per-user environment.

It follows the CRYPTO-104 architecture exactly:

| Path | Role |
|---|---|
| `scripts/package-crypto105.mjs` | Build-time packager. Checks a prebuilt ZIP against its private attestation and writes the ignored module below. No puzzle logic. |
| `lib/server/generated/crypto105-evidence.js` | Ignored, generated, server-only module (archive bytes, SHA-256, flag commitment). `null` when nothing is staged. Types in the committed `.d.ts`. |
| `lib/server/crypto105-check.ts` | Fail-closed check: valid flag format, commitment match, archive digest match. |
| `lib/server/crypto105.ts` | Assignment guard, evidence access, flag validator for `lib/server/submissions.ts`. |
| `app/api/challenge-env/crypto-105/evidence/route.ts` | Authenticated download (`application/zip`, `no-store, private`, `X-Evidence-SHA256`). |
| `components/participant/ShiftChangeChallenge.tsx` | Challenge page: story, filename, size, SHA-256, DOWNLOAD EVIDENCE, SUBMIT FLAG. |
| `tests/crypto105.integration.mjs` | Platform test: catalogue record, access, availability, download, leak checks, submissions, progression. |

## Flag format

`DDC{...}`, 24–96 characters in total, interior limited to letters, digits and underscores. Use a **base62** interior (mixed-case letters and digits) with at least 128 bits of entropy, for example 26 random base62 characters. The private generator rejects flags whose letters are too sparse for this challenge. Hex-only flags are not recommended.

The flag commitment is SHA-256 over `DDC|CRYPTO-105|flag|` followed immediately by the flag. It lives only in the private attestation and the generated server-only module.

## Staging a prebuilt package

1. Organizers generate the package offline with the private tooling. The output is `shift-change.zip` and `shift-change.attestation.json`, in a private directory outside this checkout. Run the private artifact tests and the independent solver before staging.
2. Point the build at that directory with `CRYPTO105_EVIDENCE_DIR`, or the `CRYPTO105_EVIDENCE_DIR` key in the ignored `.evidence.local.json`.
3. `npm run dev` and `npm run build` run the packager automatically (`node scripts/package-crypto105.mjs` by hand).
4. Configure the matching flag: `CRYPTO105_FLAG="DDC{...}"` in the ignored `.dev.vars` locally; `wrangler secret put CRYPTO105_FLAG` in production.
5. Apply migrations: `npm run db:migrate:local` locally; the normal hosting migration path in production.

Without a configured directory the challenge reports unavailable and everything else keeps working. A directory whose ZIP does not match its attestation stops the build.

## Flag rotation

The archive is bound to one flag. After rotating `CRYPTO105_FLAG`, regenerate the package privately, restage it and rebuild. Until both match, the challenge stays unavailable.

## Configuration failures

These all fail closed: the page shows “Evidence is awaiting configuration. Contact an organizer.”, the download returns a generic `503`, and submissions return `503` without recording an attempt or a solve.

- no staged evidence
- `CRYPTO105_FLAG` missing, malformed, or a `REPLACE_` placeholder
- `CRYPTO105_FLAG` differing from the flag the archive was generated for
- archive bytes not matching the staged digest

## Verification

```bash
node tests/crypto105.integration.mjs
```

It reads `CRYPTO105_FLAG` from `.dev.vars` and the staged ZIP location from `CRYPTO105_EVIDENCE_DIR` or `.evidence.local.json`. Run with `CRYPTO105_EXPECT_UNAVAILABLE=1` against a deliberately misconfigured dev server to check fail-closed behaviour.
