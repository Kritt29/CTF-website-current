# DDC CTF — Screen 01

A React/TypeScript hero built on the provided Next-compatible Vinext starter. Only Screen 01 is implemented.

## Run

```sh
npm install
npm run dev
npm run build
```

## Configuration

Set `registrationUrl` in `components/hero/content.ts` to the real registration destination. Until supplied, both controls disclose that the destination is unavailable; no registration is collected. CTF, Info, and FAQ are intentionally marked unavailable because their screens are outside this request.

The logo is a hand-reconstructed SVG interpretation of the supplied reference. Replace `IdentityMark` with the official vector when available.

## Structure

- `HeroScreen.tsx`: navigation, identity, typography, metadata, CTA and system labels.
- `NetworkGlobe.tsx`: orthographic spherical Earth, shader surface, coastlines, geographic particles, routes, packets, locator and depth layers.
- `globeGeometry.ts`: reproducible geometry and geographic coordinates.
- `HeroTransitionController.ts`: GSAP entrance, ScrollTrigger pin and restrained Lenis smoothing.
- `sceneState.ts`: mutable render state; animation avoids React rerenders.
- `content.ts`: editable event configuration.

Page 02 can attach after `#transition-boundary` and consume `#page-two-route` and `data-transition-progress`. The route origin follows the projected Hyderabad marker. No Page 02 content exists.

Reduced motion skips the entrance transforms, Lenis and pinning, freezes route packets and pointer motion, and keeps the composition visible. The renderer caps DPR, reduces mobile geometry/particles, pauses rendering in hidden tabs, and disposes geometries, materials, textures and listeners on unmount. A CSS fallback preserves the main composition if WebGL is unavailable.

## Assets

- Earth surface, night and topology maps: three-globe example assets, retrieved from `https://unpkg.com/three-globe/example/img/`.
- Coastline geometry: Natural Earth 1:110m land, public domain, `https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson`.
- Archivo Black: Google Fonts, SIL Open Font License (license included alongside the font).
- Distressed title texture, SVG identity, favicon, orbital geometry and atmospheric lines are procedurally authored. The reference screenshot is not used as a page background or globe asset.

## Verification

Browser captures at 1440×900, 1920×1080, 1024×900 and 390×844. Checked overflow, runtime errors, CTA feedback, keyboard focus, scroll midpoint and boundary, reverse scroll, and reduced-motion pin removal. The registration destination remains a content dependency; signup submission cannot be verified until it is supplied.
