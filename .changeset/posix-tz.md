---
"@thomasfosterau/effect-time": minor
---

Add `PosixTz`: POSIX TZ strings (`EST5EDT,M3.2.0,M11.1.0`, `<+1030>-10:30<+11>-11,M10.1.0,M4.1.0`), the `TZ` environment variable format and the TZif footer. `parser`, `parse`, `format` and the `FromString` schema read and print a `PosixTz` record: the standard and daylight designations, with UTC offsets in seconds east of Greenwich, and the daylight saving rule (`Jn`, `n` and `Mm.w.d` dates, with RFC 8536's extended transition times).
