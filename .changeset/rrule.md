---
"@thomasfosterau/effect-time": minor
---

Add `RRule`: iCalendar recurrence rules, the RFC 5545 `recur` value of an `RRULE` property (`FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10`). `parser`, `parse`, `format` and the `FromString` schema read and print an `RRule` record: frequency, `UNTIL` as written, `COUNT`, `INTERVAL`, the `BY…` lists and `WKST`. Every value is range-checked and RFC 5545's cross-part restrictions fail the parse with a positioned error.
