# Participant application

The participant area uses the existing Vinext Cloudflare Worker and D1 binding `DB`. It adds no separate server or scroll/animation system. Public registration stays on Unstop; it does not create a platform account.

## Local setup

1. `npm ci`
2. `npm run setup` — applies local migrations, then interactively creates a local participant (username, optional display name, hidden password with confirmation; email and participant ID are generated). `npm run db:migrate:local` applies migrations only.
3. `npm run dev`, then sign in at `http://localhost:5173/login`.
4. For scripted provisioning, use the lower-level `npm run participant:create:local` (it shares `npm run setup`'s validation and hashing). The command reads a JSON object from standard input with `username`, `email`, `password`, `displayName`, and `participantId`. Supply a unique password (12 characters minimum, 72 UTF-8 bytes maximum) through a secure input mechanism. Do not put passwords in shell arguments, source files, chat, or version control. The command hashes with bcrypt (cost 12); only the hash reaches D1.
5. Publish a real starting challenge using `npm run challenge:add:local`, again JSON on standard input: `id` (lowercase slug), `challengeCode`, `title`, `category`, `difficulty`, `description`, `active: true`, `starting: true`. Categories: WEB, CRYPTO, PWN, REVERSE, FORENSICS, OSINT. Omitted booleans default false.

These commands only modify local D1. No accounts, passwords, or announcements are seeded. Migrations publish the implemented WEB-101 and WEB-102 challenges as active/starting-eligible. The final organizer/Unstop provisioning process remains undecided. Both challenges need their separate server-side flag secret configured.

## Production setup still required

Provision a real Cloudflare D1 database and bind it as `DB` in the deployment environment. Apply `db/migrations/0001_participant.sql` to that database before serving participant traffic. `wrangler.local.json` contains a local placeholder database ID, not production infrastructure. Do not deploy that ID as a real database. Migrate and provision approved accounts through the deployment operator's access-controlled process; the supplied account CLI intentionally has no remote write mode. Use HTTPS. Database backups and operational monitoring should be configured before the event.

## Authentication and ownership

- Login accepts username or email. Responses never distinguish an unknown account from an incorrect password.
- Passwords use bcrypt cost 12. Sessions use 256-bit random opaque tokens, with SHA-256 token hashes stored server-side and a seven-day expiry.
- The session cookie is HttpOnly, SameSite=Lax, Path=/, and Secure in production/HTTPS. Auth restores through `/api/auth/me`; no localStorage credentials.
- Login has persisted 15-minute account/IP attempt limits. IP limits use Cloudflare's supplied client IP header, not arbitrary forwarded-for headers. Mutating endpoints reject foreign/missing origins. Login accepts bounded JSON only.
- Logout deletes the server-side session. Protected pages and APIs validate the current session independently.
- Composite (user_id, challenge_id) assignment history and a partial unique index on unsolved user_id allow multiple completed challenges but only one current challenge. Server-side atomic selection makes concurrent Start/Next requests idempotent. First selection uses active starting challenges; later selections use active unassigned challenges. Assignment and original participant start time persist. Challenge access checks the requested assignment.
- No flags, answers, credential hashes, or session tokens are returned in response JSON or shipped in client code. Future vulnerable challenge environments must be isolated from platform credentials and database access.

## Routes and data

`app/(participant)/layout.tsx` owns one persistent `ParticipantShell`; navigation uses client links. The header stays mounted across dashboard, challenge list/detail, submissions, leaderboard, and rules. Each page also checks authentication on the server.

APIs: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/dashboard`, `GET /api/challenges`, `POST /api/challenges/start`, `POST /api/challenges/next`.

`lib/event.ts` is the shared event source, including the unchanged public countdown target. The current October 12 midnight start needs organizer confirmation. End time is deliberately null until confirmed; the participant clock counts down to the start, then displays an end-time-pending state. It never invents an end date.

WEB-101, WEB-102, and FORENSICS-103 are playable and validate flags through `POST /api/submissions`; `GET /api/submissions` returns only the current participant's latest 50 attempts. Scoring, rankings, hint transactions, further challenge environments, password recovery, and full competition rules remain unimplemented. Dashboard solve counts and start/solve activity derive from persisted assignments; score remains zero and rank null. Announcements come from published database records. After a solve, the participant explicitly requests NEXT CHALLENGE; validation never auto-assigns. Dashboard and catalogue separate current, completed, and available/unassigned states. Exhausting eligible challenges returns allChallengesCompleted without an error.

Submission requests require the challenge to be assigned to the participant, a valid session, bounded JSON, and same-origin protection. A persisted atomic throttle permits one attempt per participant every two seconds. Flag comparison is case-sensitive after trimming surrounding whitespace and uses fixed-length digests with timing-safe comparison. Only challenge/result/timestamp metadata is stored, never flag contents or their hashes. Attempt insertion and the conditional first-solve update run in a D1 transaction. Already-solved requests return an explicit no-op response without another history record or changing solvedAt; throttled, malformed, invalid, and unauthorized requests do not become challenge attempts. The frontend clears the flag after a processed result and guards in-flight duplicate clicks.

Apply `npm run db:migrate:local` before using submissions. With the local app and private flag configured, run `npm run build` then `node tests/submissions.integration.mjs`. The test creates and removes its own accounts, checks concurrency/privacy/solve persistence, and exercises the browser form.

## Verification

Run `npx tsc --noEmit` and `npm run build`. With the local app running, execute `node tests/participant.integration.mjs`. Set `PLAYWRIGHT_MODULE` to the import URL of an installed Playwright module if the Codex runtime default is unavailable; install its browser or use the expected Edge channel. `TEST_BASE_URL` defaults to localhost:5173. Use this test only against the local app and its local D1: it creates random test records, verifies API/session/assignment behavior and browser routing, then removes its fixtures. Screenshots go to ignored `outputs/`.

## Progression migration

Apply 0006_challenge_progression.sql to each deployment database before using the new code. It copies all assignment and solve timestamps into the composite-key table and enforces one unfinished assignment with a partial unique index. Run node tests/progression.integration.mjs against local D1 to verify concurrency, solve/next flow, catalogue, completion UI, and future-category eligibility.
