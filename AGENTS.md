# Locked Page 01

Approved source: Git commit `12922b4dbb4bd504fb0dae8dbaf87fdc960a7014`.
Do not edit `components/hero`, `app/globals.css`, `app/layout.tsx`, or existing
`public` assets without an explicit user request to change Page 01.
Page 02 must own its styles, registration UI, content, and animation lifecycle.
Never call global ScrollTrigger refresh/revert/kill from Page 02.
Do not implement a Page 01 → Page 02 transition until the user requests it.
Run `node scripts/check-page01-lock.mjs` before publishing Page 02 changes.
