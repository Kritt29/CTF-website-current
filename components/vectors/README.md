# Challenge Vectors — isolated Page 02

`/challenge-vectors` renders Page 02 without the Hero. The home route mounts it
after the approved Hero's initial layout measurements, below a plain boundary.
There is no Page 01 → Page 02 transition, shared ScrollTrigger, or Hero import.

- `ChallengeVectors.tsx`: editorial composition and accessible category details.
- `VectorObject.tsx`: six salvaged SVG illustrations; unchanged in this rebuild.
- `content.ts`: category copy and nullable, unconfirmed event configuration.
- `VectorRegister.tsx`: independent registration affordance; no backend.
- `useVectorMotion.ts`: local, visibility-gated pointer/scroll focus. No global animation lifecycle.
- `vectors.css`: Page 02-only selectors, natural document flow, spacious objects.

The approved Hero's 26 protected files are checked by
`node scripts/check-page01-lock.mjs`. No Hero source or existing asset was changed.
Browser comparisons preserve the opening pixels and tagline end/return transforms.
The vector objects approximate the reference's materials; they are not photographic renders.
