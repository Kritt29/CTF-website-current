# DDC CTF — Page 01 motion

React/TypeScript on the existing Next-compatible Vinext starter. The approved first frame is locked. Motion layers onto its existing artwork; Page 02 is not implemented.

The signature sequence is a **Hyderabad signal handoff**. The globe advances as the large title passes the camera's left edge. Eight signals converge at Hyderabad; one orange route extends from that geographic anchor past the bottom edge. The existing “ENTER THE GRID.” line returns at the handoff.

## Run

```sh
npm install
npm run dev
npm run build
```

## Structure and configuration

- `components/hero/HeroScreen.tsx`: real navigation, supplied DDC mark, textured HTML title, metadata, CTA and system labels.
- `components/hero/NetworkGlobe.tsx`: orthographic scene, geography, city lights, routes, moons and projected Hyderabad locator. Exposes an imperative render callback to the shared motion ticker.
- `components/hero/motion/useHeroMotion.ts`: lifecycle, media conditions, native scroll progress, inertial pointer input, visibility suspension and cleanup.
- `components/hero/motion/intro.ts` and `scroll.ts`: composed entrance and separate supporting-content/spatial timelines.
- `components/hero/motion/globeMotion.ts`: transforms relative to the approved scene, sparse idle signals, batched gathering routes and acquisition ring.
- `components/hero/motion/bridge.ts` and `SignalBridge.tsx`: a projected locator-to-boundary SVG signal, hidden at scroll zero.
- `components/hero/globeGeometry.ts`: geographic conversion, seeded geometry, city locations and arc construction.
- `components/hero/content.ts`: event configuration. Set `registrationUrl` here when the real destination is available.
- `app/globals.css`: design tokens, reference-aligned desktop composition and mobile adaptation.

CTF, Info and FAQ remain marked unavailable because their screens are outside this request. No signup data is collected while the registration URL is unset.

## Asset provenance

- `public/assets/ddc-logo-reference.png`: unchanged pixel crop of the actual DDC mark from the user-supplied `Page -1.png` (x62, y12, 85×72). It replaces the earlier invented SVG mark.
- Earth day/topology maps: three-globe example assets at `https://unpkg.com/three-globe/example/img/`.
- Earth lights: `https://raw.githubusercontent.com/mrdoob/three.js/r150/examples/textures/planets/earth_lights_2048.png`.
- Lunar surface: Three.js example texture, `https://github.com/mrdoob/three.js/blob/dev/examples/textures/planets/moon_1024.jpg`, saved as `public/assets/moon-surface.jpg` and mapped onto three real sphere meshes with directional lighting.
- Detailed coastlines: Natural Earth public-domain 1:50m land, `https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_land.geojson`.
- Archivo Black: Google Fonts, SIL Open Font License, included with the font.
- `public/assets/distressed-metal.png` and `public/assets/atmosphere.png`: generated material/environment assets; prompts documented in `ASSET_NOTES.md`. The material is clipped inside real HTML text. The background contains no UI, globe, logos or lettering. The supplied screenshot is never used as a flattened page or globe.

## Motion and accessibility

The entrance lasts 1.75 seconds and yields immediately to scrolling. Idle movement ramps in after four seconds, with one short signal every 18 seconds. Fine pointers produce a small depth response; the main title stays still. Native CSS sticky provides the journey without scroll hijacking or pin spacers. Large geometry follows a 105ms interpolation constant (65ms mobile); supporting text follows input directly.

Desktop travel is 1.32 hero heights, tablet 1.05, mobile 0.72. Mobile has reduced spatial travel, no pointer response, and restores the existing registration button at the handoff. Reduced motion removes the intro, continuous rendering, parallax, spatial transformation and sticky journey. Live preference changes restore the original artwork. All content remains available without the animation.

The boundary is an empty one-pixel element. No second-page content or interaction is supplied.

## Verification and performance

Repeated desktop rendering and direct comparison at the approved reference's exact 1672×941 viewport. Earth has a 600.25px diameter at this size with uniform spherical scale; its wider orbital envelope is independent of the body. This pass preserves the title, CTA, navbar, metadata and left composition, while correcting the globe, moons, atmosphere and associated HUD. Additional 1440×900 and 390×844 checks confirm responsive rendering and no horizontal overflow.

The desktop scene uses 64 resting draw calls, about 58,400 triangles and 25,400 points. Acquisition adds at most three draws. DPR is capped at 1.8 desktop and 1.3 mobile. There is no full-screen bloom, new texture asset or per-frame React state. Signal geometry is constructed once; eight small point positions and shader uniforms update during acquisition. One shared GSAP ticker drives the scene. Rendering suspends offscreen and in hidden tabs; reduced motion renders only after asset completion and resize.

Browser verification covers the entrance, pointer response, slow/normal/fast wheel input, repeated reversal, sticky boundaries, resize, refresh during the journey, touch tablet/mobile, registration feedback, live reduced-motion changes and offscreen suspension. Opening-frame pixel comparison uses the saved approved 1672×941 baseline. Local screenshots, recordings and verification results are in ignored `outputs/`; QA scripts are in ignored `work/`.

Physical-device GPU and touch feel remain useful final tuning checks; headless browser timings are not a hardware performance guarantee. WebGL resources, observers, listeners, timelines and outstanding asset requests are disposed on unmount.
