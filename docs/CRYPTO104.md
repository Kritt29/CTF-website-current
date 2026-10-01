# CRYPTO-104 — Dead Drop 64: Receiver’s Copy

Maintainer notes for setup and operations. This document deliberately omits the puzzle construction and solve path. The generator, reference solver, artifact tests and walkthrough are kept by organizers outside this repository and must never be committed here.

## What the platform does

CRYPTO-104 is a static evidence challenge (CRYPTO, HARD, desktop-only) reached through NEXT CHALLENGE (`active=1`, `starting=0`, migration `0008_crypto104.sql`). Assigned participants download one immutable archive, `dead-drop-64.zip`, and submit the recovered flag through the shared submission flow. Every participant receives byte-identical evidence. There is no live service and no per-user environment.

| Path | Role |
|---|---|
| `scripts/package-crypto104.mjs` | Generic build-time packager. It checks a prebuilt ZIP against its private attestation and writes the ignored module below. It contains no puzzle logic. |
| `lib/server/generated/crypto104-evidence.js` | Ignored, generated, server-only module (archive bytes, archive SHA-256, flag commitment). `null` when nothing is staged. Types live in the committed `.d.ts`. |
| `lib/server/crypto104-check.ts` | Fail-closed check: valid flag format, commitment match, archive digest match. |
| `lib/server/crypto104.ts` | Assignment guard, evidence access, flag validator for `lib/server/submissions.ts`. |
| `app/api/challenge-env/crypto-104/evidence/route.ts` | Authenticated download (`application/zip`, `no-store, private`, `X-Evidence-SHA256`). |
| `components/participant/DeadDropChallenge.tsx` | Challenge page: story, clue, filename, size, SHA-256, DOWNLOAD EVIDENCE, SUBMIT FLAG. |
| `tests/crypto104.integration.mjs` | Platform test: access, availability, download, submissions, progression. |

The Worker never generates or reconstructs the puzzle. It serves only the offline-built ZIP.

## Flag format

`DDC{...}`, 24–96 ASCII characters in total, interior limited to letters, digits and underscores. Production flags should carry at least 128 bits of privately generated entropy (for example 32 random hex characters inside the braces).

The flag commitment is SHA-256 over the UTF-8 bytes of `DDC|CRYPTO-104|flag|` followed immediately by the flag. It is stored only in the private attestation and the generated server-only module. It is never placed in the ZIP or exposed by any API.

## Staging a prebuilt package

1. Organizers generate the package offline with the private tooling. The output is `dead-drop-64.zip` and `dead-drop-64.attestation.json`, written to a private directory outside this checkout.
2. Point the build at that directory with either:
   - the `CRYPTO104_EVIDENCE_DIR` environment variable at build/dev time, or
   - the ignored `.evidence.local.json`: `{"CRYPTO104_EVIDENCE_DIR": "<absolute path>"}`.
3. `vite.config.ts` runs the packager on every `npm run dev` and `npm run build`. You can also run it by hand with `node scripts/package-crypto104.mjs`.
4. Configure the matching flag:
   - locally: `CRYPTO104_FLAG="DDC{...}"` in the ignored `.dev.vars`, then restart the dev server
   - production: `wrangler secret put CRYPTO104_FLAG`
5. Apply migrations: `npm run db:migrate:local` locally. Use the normal hosting migration path in production.

If no directory is configured, the packager emits an unavailable module, and the build and the other challenges keep working. If a directory is configured but the ZIP does not match its attestation, the build stops with an error.

## Flag rotation

The archive is bound to one flag. After rotating `CRYPTO104_FLAG`, regenerate the package privately with the new flag, restage it, and rebuild. Until both match, the challenge stays unavailable. Reusing the same flag and artifact version reproduces byte-identical evidence.

## Configuration failures

All of the following fail closed. The page shows “Evidence is awaiting configuration. Contact an organizer.”, the download returns a generic `503`, and submissions return `503` without recording an attempt or a solve:

- no staged evidence (null module)
- `CRYPTO104_FLAG` missing, malformed, or a `REPLACE_` placeholder
- `CRYPTO104_FLAG` differing from the flag the staged archive was generated for (commitment mismatch)
- archive bytes not matching the staged digest

Responses never include the flag, the commitment, private paths, or comparison values.

## Verification

```bash
node tests/crypto104.integration.mjs
```

The test reads `CRYPTO104_FLAG` from `.dev.vars` and the staged ZIP location from `CRYPTO104_EVIDENCE_DIR` or `.evidence.local.json`. To check fail-closed behaviour against a deliberately misconfigured dev server, run it with `CRYPTO104_EXPECT_UNAVAILABLE=1`. The route sets a correct `Content-Length`, but vinext's response pipeline re-chunks every dynamic response (JSON included), both under `npm run dev` and in the locally built Worker. The test therefore accepts a missing header only when the response is chunked, and requires a match when the header is present. `REQUIRE_CONTENT_LENGTH=1` makes the header mandatory, for example when checking a deployed edge.
