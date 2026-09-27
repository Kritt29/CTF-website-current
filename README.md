# DDC CTF Platform

Custom Capture The Flag competition platform for Digital Defence Club, CBIT.

## Overview

This repository contains the public DDC CTF event website and the authenticated participant interface. The public experience includes the cinematic Pages 01–03 journey. The participant application provides login, a protected dashboard, persistent competition navigation, and the foundation for server-assigned challenges.

Event registration is handled externally through Unstop. The custom DDC platform handles competition access and gameplay.

## Current features

- Cinematic public landing website with the approved Page 01, Page 02, and Page 03 scenes.
- Three.js globe/network scene, GSAP/ScrollTrigger choreography, Lenis integration, responsive layouts, and reduced-motion handling.
- Participant login with bcrypt password verification and HttpOnly session cookies.
- Persistent sessions restored through `/api/auth/me`; protected participant routes redirect unauthenticated visitors to `/login`.
- Authenticated dashboard with participant identity, event countdown, assignment status, statistics, announcements, categories, and recent activity.
- Persistent participant topbar across dashboard, challenges, challenge detail, submissions, leaderboard, and rules routes.
- Server-side starting-challenge assignment that is saved and remains stable on refresh or concurrent starts.
- Logout that invalidates the server session.

Scoring, flag submission and validation, challenge environments, hints and penalties, leaderboard calculations, password recovery, admin tooling, and Unstop-to-platform account provisioning are not implemented yet.

## Tech stack

Frontend: React, TypeScript, Vinext/Vite, Three.js, GSAP/ScrollTrigger, Lenis, and Lucide icons.

Backend: Vinext server routes running through the Cloudflare Vite/Wrangler integration, Cloudflare D1 with SQLite-compatible SQL, bcryptjs password hashing, and opaque server-side sessions stored as SHA-256 token hashes.

## Project structure

```text
app/                  public and participant routes plus API handlers
components/           public scenes, login UI, and participant UI
db/                   Drizzle schema and SQL migrations
lib/server/           D1 access, authentication, API helpers, and competition logic
lib/participant/      shared participant types
public/assets/        approved visual assets and textures
scripts/              local database migration and provisioning helpers
tests/                participant integration checks
docs/                 participant platform setup and deployment notes
```

## Application routes

```text
/                         Public Pages 01–03 journey
/challenge-vectors        Standalone Page 02 view
/login                    Participant login
/dashboard                Protected participant dashboard
/challenges               Protected challenge catalogue
/challenges/:challengeId Protected assigned challenge route
/submissions              Protected submissions placeholder
/leaderboard              Protected leaderboard placeholder
/rules                    Protected rules placeholder
```

## Backend API

```text
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
GET  /api/dashboard
GET  /api/challenges
POST /api/challenges/start
```

## Authentication

Participants sign in with an organizer-provisioned username or email and password. Passwords are stored only as bcrypt hashes. Successful login creates a random opaque session token; only its SHA-256 hash is stored in D1 and the token is sent in an HttpOnly, SameSite cookie. The session survives refresh and route changes. Protected pages and APIs validate the server-side session. Logout deletes it.

The participant provisioning command is local-only by design. The final production account provisioning workflow must be approved by the organizers.

## Challenge flow

```text
Login → Dashboard → Start Challenge
       → server selects an active starting challenge
       → assignment and participant start time are persisted
       → participant enters the assigned challenge route
```

Challenge execution, flag submission, judging, scoring, and progression are future work. Until a real active starting challenge is published, the start endpoint reports that none is available.

## Local development

Requirements: Node.js 22.13.0 or newer, npm, and Git.

```sh
git clone https://github.com/Kritt29/CTF-website-current.git
cd CTF-website-current
npm ci
npm run db:migrate:local
npm run dev
```

Open `http://localhost:5173`.

To provision a local participant, pass JSON through standard input to `npm run participant:create:local`. The required fields are `username`, `email`, `password`, `displayName`, and `participantId`. Do not put passwords in shell history or commit them. To publish a local starting challenge, use `npm run challenge:add:local`; see [docs/PARTICIPANT_PLATFORM.md](docs/PARTICIPANT_PLATFORM.md) for the exact fields and production requirements.

Useful checks:

```sh
npx tsc --noEmit --incremental false
npm run build
npm run lint
node tests/participant.integration.mjs
```

`npm start` runs the built Worker locally after `npm run build`. The included `wrangler.local.json` and D1 database ID are local development configuration, not production infrastructure.

## Environment variables

The local app does not require application secrets or a `.env` file. Cloudflare deployment configuration supplies the D1 binding named `DB`. Configure the production D1 database and HTTPS deployment through the hosting environment; never commit credentials, tokens, or secret keys.

## Registration

Event registration is handled separately through [Unstop](https://unstop.com/hackathons/cryptx-chaitanya-bharathi-institute-of-technology-cbit-hyderabad-1761452). The custom platform handles participant login and competition gameplay after organizer-approved account provisioning.

## Security notes

- Platform authentication, participant records, assignments, and session state are server-controlled.
- Client-side state is never trusted for authentication, scoring, or challenge validation.
- Password hashes, session tokens, flags, answers, and signing secrets are not returned to the browser.
- Intentionally vulnerable CTF challenges must run in isolated environments separate from platform authentication and data.
- Mutating API requests enforce same-origin checks and login attempts are rate-limited.

## Current status and next work

- Complete isolated challenge engine and flag submission flow.
- Add scoring, hints, penalties, and leaderboard calculations.
- Add organizer/admin tooling and approved production account provisioning.
- Confirm event end time and configure production D1/Cloudflare deployment.
- Load-test production asset delivery and participant APIs before the event.

## Registration CTA source

The shared registration destination is defined in `components/shared/registration.ts`. Do not duplicate or replace it with a new URL in individual components.
