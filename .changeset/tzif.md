---
"@thomasfosterau/effect-time": minor
---

Add `Tzif`: an effect-parse binary parser for TZif files (RFC 8536, versions 1–4), the compiled zone files of the tz database. A `Tzif` holds the transitions, local time types (offset, DST flag, designation, standard/UT indicators), leap seconds and the POSIX TZ footer (as a `PosixTz`). The format's structural requirements are checked, and a violation fails at its byte offset. `parser` and `parse`.
