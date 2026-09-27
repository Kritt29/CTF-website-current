# Participant application

The participant area uses the existing Vinext Cloudflare Worker and D1 binding `DB`. It adds no separate server or scroll/animation system. Public registration stays on Unstop; it does not create a platform account.

## Local setup

1. `npm ci`
2. `npm run db:migrate:local`
3. `npm run dev`
4. Provision an organizer-approved account using `npm run participant:create:local`. The command reads a JSON object from standard input with `username`, `email`, `password`, `displayName`, and `participantId`. Supply a unique password (12 characters minimum, 72 UTF-8 bytes maximum) through a secure input mechanism. Do not put passwords in shell arguments, source files, chat, or version control. The command hashes with bcrypt (cost 12); only the hash reaches D1.
5. Publish a real starting challenge using `npm run challenge:add:local`, again JSON on standard input: `id` (lowercase slug), `challengeCode`, `title`, `category`, `difficulty`, `description`, `active: true`, `starting: true`. Categories: WEB, CRYPTO, PWN, REVERSE, FORENSICS, OSINT. Omitted booleans default false.

These administrative commands only modify local D1. No accounts, passwords, sample active challenges, or announcements are seeded in the application. The final organizer/Unstop provisioning process remains undecided. Until a real starting challenge is published, Start Challenge displays an honest unavailable message.

## Production setup still required

Provision a real Cloudflare D1 database and bind it as `DB` in the deployment environment. Apply `db/migrations/0001_participant.sql` to that database before serving participant traffic. `wrangler.local.json` contains a local placeholder database ID, not production infrastructure. Do not deploy that ID as a real database. Migrate and provision approved accounts through the deployment operator's access-controlled process; the supplied account CLI intentionally has no remote write mode. Use HTTPS. Database backups and operational monitoring should be configured before the event.

## Authentication and ownership

- Login accepts username or email. Responses never distinguish an unknown account from an incorrect password.
- Passwords use bcrypt cost 12. Sessions use 256-bit random opaque tokens, with SHA-256 token hashes stored server-side and a seven-day expiry.
- The session cookie is HttpOnly, SameSite=Lax, Path=/, and Secure in production/HTTPS. Auth restores through `/api/auth/me`; no localStorage credentials.
- Login has persisted 15-minute account/IP attempt limits. IP limits use Cloudflare's supplied client IP header, not arbitrary forwarded-for headers. Mutating endpoints reject foreign/missing origins. Login accepts bounded JSON only.
- Logout deletes the server-side session. Protected pages and APIs validate the current session independently.
- A unique starting-assignment constraint per user and a D1 transaction make concurrent starts idempotent. Selection is server-side from active starting challenges. Assignment and participant start time persist. Challenge detail access is restricted to the participant's assignment.
- No flags, answers, credential hashes, or session tokens are returned in response JSON or shipped in client code. Future vulnerable challenge environments must be isolated from platform credentials and database access.

## Routes and data

`app/(participant)/layout.tsx` owns one persistent `ParticipantShell`; navigation uses client links. The header stays mounted across dashboard, challenge list/detail, submissions, leaderboard, and rules. Each page also checks authentication on the server.

APIs: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/dashboard`, `GET /api/challenges`, `POST /api/challenges/start`.

`lib/event.ts` is the shared event source, including the unchanged public countdown target. The current October 12 midnight start needs organizer confirmation. End time is deliberately null until confirmed; the participant clock counts down to the start, then displays an end-time-pending state. It never invents an end date.

Scoring, rankings, hint transactions, submission judging, challenge environments, password recovery, and full competition rules remain unimplemented. Backend statistics return real zero/null/empty values. Activity currently contains only the persisted starting action. Announcements come from published database records.

## Verification

Run `npx tsc --noEmit` and `npm run build`. With the local app running, execute `node tests/participant.integration.mjs`. Set `PLAYWRIGHT_MODULE` to the import URL of an installed Playwright module if the Codex runtime default is unavailable; install its browser or use the expected Edge channel. `TEST_BASE_URL` defaults to localhost:5173. Use this test only against the local app and its local D1: it creates random test records, verifies API/session/assignment behavior and browser routing, then removes its fixtures. Screenshots go to ignored `outputs/`.
