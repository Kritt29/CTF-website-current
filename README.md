# DDC CTF — Digital Defence Club, CBIT

Frontend for the DDC Capture the Flag event: a cinematic globe introduction, interactive challenge categories, and event highlights. Built with React, TypeScript, Vinext/Vite, Three.js, and GSAP.

## Current status

| Section | Implemented |
| --- | --- |
| Page 01 — Enter the Grid | Globe/network scene, introduction, registration CTA, and scroll choreography |
| Page 02 — Challenge Vectors | WEB, CRYPTO, PWN, REVERSE, FORENSICS, OSINT; artwork and detail dialogs |
| Page 03 — Event Highlights | Monolith environment, live countdown, TBA event details, and registration CTAs |
| Journey | Page 01 → 02 and Page 02 → 03 transitions with reverse scrolling and reduced-motion support |
| Responsive support | Mobile/tablet layouts, larger touch targets, shorter handoff ranges, and section navigation |

**This repository implements the event frontend.** It does not implement a CTF competition backend, authentication, challenge hosting, scoring, leaderboard, or registration submission. FAQ and remaining pages are pending. The final CTF platform and hosting setup are separate decisions.

The approved desktop designs and six Challenge Vector artworks should be preserved unless a change is explicitly agreed with the team.

## Get started

Requirements: **Node.js 22.13.0 or newer**, npm, Git, and access to this private repository.

```sh
git clone https://github.com/Kritt29/DDC-website-frontend.git
cd DDC-website-frontend
git switch claude-smoothness
npm ci
npm run dev
```

Open **http://localhost:5173**. The `claude-smoothness` branch contains the mobile pass and recent transition work; use it until that work has been merged into `main`.

A clean clone uses the portable Vinext execution profile automatically. The current public-facing frontend needs no registration API keys or backend setup to run locally. Do not copy another developer's `node_modules`, `.sites-runtime`, or environment files.

### Commands

```sh
# Local development
npm run dev

# TypeScript validation without writing incremental cache
npx tsc --noEmit --incremental false

# Production build
npm run build

# Lint (separate from the build)
npm run lint
```

`npm start` runs the built Cloudflare Worker locally through Wrangler and expects `dist/server/wrangler.json` from a successful build. It is not a deployment command. Keep the existing framework scripts rather than replacing them with Next.js commands.

## Routes

- `/` — complete Pages 01–03 journey.
- `/#home` — Page 01.
- `/#challenge-vectors` — Page 02 within the journey.
- `/#event-highlights` — Page 03 within the journey.
- `/challenge-vectors` — standalone Page 02 for focused development and checks.

Section navigation accounts for the scenes' scroll resting positions. FAQ remains unavailable.

## Project map

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Mounts the three sections |
| `app/layout.tsx` | Shared document shell, metadata, and global styles |
| `app/globals.css` | Existing design system and hero styling |
| `app/mobile.css` | Mobile/tablet refinements, scoped to widths up to 1024px |
| `components/hero/` | Page 01, Three.js globe, event config, and hero motion |
| `components/journey/JourneyHandoff.tsx` | Master scene handoff progress and section navigation |
| `components/journey/destination.ts` | Page 03 arrival choreography |
| `components/journey/smoothScroll.ts` | Existing Lenis/GSAP integration; native touch scrolling |
| `components/vectors/` | Page 02 layout, six artworks, content, dialogs, and local motion |
| `components/highlights/` | Page 03 layout, isolated countdown, event config, and CTAs |
| `public/assets/` | Local artwork, textures, logo, and font assets |

## Registration and event configuration

No registration destination has been supplied yet. An unset URL shows an announcement notice when a CTA is activated; it does not submit data or create an account.

- **Pages 01 and 03:** set `event.registrationUrl` in `components/hero/content.ts`. Page 03 already imports this same config.
- **Page 02:** currently has a separate `vectorEvent.registrationUrl` in `components/vectors/content.ts`. Set it to the same approved destination when registration becomes available. Registration config is not yet unified across all three pages.
- **Page 03 countdown and details:** edit `components/highlights/content.ts`.
- **Page 02 descriptions and summary details:** edit `components/vectors/content.ts`.

The countdown targets **October 12, 2026 at 00:00 India Standard Time (UTC+05:30)**. Midnight is the current interpretation of the date-only brief; update `startsAt` when the event time is confirmed. It uses the visitor's browser clock, updates once per second while nearby and visible, and stops at zero. Changing the date also requires checking its visible label and accessible text in `Countdown.tsx`.

Page 03 participants, challenges, duration, eligibility, and prize pool remain **TBA**. Do not replace them with invented numbers. Page 01 still contains approved legacy event copy such as “24 Hours” and “Limited Slots”; verify that copy against confirmed event details before launch.

## Team workflow

Ask the repository owner for collaborator access using your GitHub username, then accept the invitation. Use branches and pull requests to collaborate.

```sh
# Until the current work is merged into main
git switch claude-smoothness
git pull --ff-only origin claude-smoothness
git switch -c feature/short-description

# After making and checking your changes
git add <changed-files>
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Open a pull request against the agreed integration branch. Once `claude-smoothness` is merged, use `main` as the starting point and PR base instead. Check `git status` before switching branches; preserve uncommitted work. Avoid force-pushing shared branches.

Include what changed, screenshots for visual work, and checks performed in each PR. Keep performance fixes, visual changes, and backend work separately reviewable. Never commit credentials, build output, or dependency folders.

## Motion, accessibility, and performance

The journey uses GSAP/ScrollTrigger and native sticky scene wrappers. Lenis smooths wheel input on supported fine-pointer devices; touch retains native scrolling. Mobile/tablet handoff distances are shorter, while the desktop choreography is retained. Do not add a second scroll-smoothing system or competing transform writers.

Reduced motion bypasses the cinematic journey. Registration controls support keyboard activation, dialogs provide close controls, and the countdown is isolated from the rest of the React scene.

### Verification performed

- Browser-emulated widths: **320, 390, 768, 1024, and 1672px**.
- Horizontal overflow, registration notices, all six challenge dialogs, and runtime errors.
- Touch swipe input, section navigation, direct Page 03 anchors, forward/reverse scrolling, and reduced-motion changes.
- TypeScript validation and production build passed for the mobile pass.

The production build still reports a large-bundle warning. Browser emulation is not a substitute for testing actual iOS/Android devices. **150 concurrent visitors have not been load-tested**, and no hosting-capacity guarantee is implied. Profile production asset delivery, hosting limits, and lower-end mobile performance before the event.

Pushing to GitHub does not itself publish the website. Coordinate production deployment and any load testing with the team separately.

## Asset provenance

Preserve the existing artwork and provenance notes:

- [Generated material/environment notes](ASSET_NOTES.md)
- [Challenge Vector reference assets](components/vectors/REFERENCE_ASSETS.md)
- [Page 03 background notes](components/highlights/ASSET_NOTES.md)

The DDC logo is a crop of the supplied club mark, not a generated replacement. Earth maps use three-globe example assets; Earth lights and lunar textures come from Three.js examples. Coastlines use Natural Earth public-domain data. Archivo Black is bundled with its SIL Open Font License. See the asset notes and included license files when reusing or replacing these resources.
