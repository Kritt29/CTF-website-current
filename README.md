# DDC CTF — corrected static Screen 01

React/TypeScript on the existing Next-compatible Vinext starter. This revision is a **static visual approval frame**. No entrance, pointer animation, scroll pinning, route animation, or Page 02 is active or rendered.

## Run

```sh
npm install
npm run dev
npm run build
```

## Structure and configuration

- `components/hero/HeroScreen.tsx`: real navigation, supplied DDC mark, textured HTML title, metadata, CTA and system labels.
- `components/hero/NetworkGlobe.tsx`: real orthographic spherical geometry, geographic coastline and lights, varied route/node hierarchy, atmosphere and Hyderabad locator. Rendering occurs on asset completion and resize only.
- `components/hero/globeGeometry.ts`: geographic conversion, seeded geometry, city locations and arc construction.
- `components/hero/content.ts`: event configuration. Set `registrationUrl` here when the real destination is available.
- `app/globals.css`: design tokens, reference-aligned desktop composition and mobile adaptation.

CTF, Info and FAQ remain marked unavailable because their screens are outside this request. No signup data is collected while the registration URL is unset.

## Asset provenance

- `public/assets/ddc-logo-reference.png`: unchanged pixel crop of the actual DDC mark from the user-supplied `Page -1.png` (x62, y12, 85×72). It replaces the earlier invented SVG mark.
- Earth day/topology maps: three-globe example assets at `https://unpkg.com/three-globe/example/img/`.
- Earth lights: `https://raw.githubusercontent.com/mrdoob/three.js/r150/examples/textures/planets/earth_lights_2048.png`.
- Detailed coastlines: Natural Earth public-domain 1:50m land, `https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_land.geojson`.
- Archivo Black: Google Fonts, SIL Open Font License, included with the font.
- `public/assets/distressed-metal.png` and `public/assets/atmosphere.png`: generated material/environment assets; prompts documented in `ASSET_NOTES.md`. The material is clipped inside real HTML text. The background contains no UI, globe, logos or lettering. The supplied screenshot is never used as a flattened page or globe.

## Static visual verification

Repeated desktop rendering and visual comparison against the approved reference at 1440×900. Checked actual logo, optical title bounds, metallic distress, globe size and roundness, light hierarchy, locator, background, CTA, navigation and callouts. A 390×844 check confirms no horizontal overflow.

The final static browser check reports zero browser errors, zero running animations, zero pin spacers, no Page 02 transition path, and identical pixels after pointer movement, scrolling and a wait. WebGL resources, observers and outstanding asset requests are disposed on unmount. Reduced-motion users see the same already-static frame.
