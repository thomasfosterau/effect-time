---
"@thomasfosterau/effect-time": minor
---

First release: `Clock` and `DateTime`, Effect's own modules re-exported under one import, built to `dist/` with `exports` and declarations, `effect` as a peer. The `Date` re-export is gone: `effect/Date` does not exist in any Effect 4 release, so it never resolved.
