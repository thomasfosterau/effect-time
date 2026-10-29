---
"@thomasfosterau/effect-time": minor
---

Add `CronExpression`: cron expressions (`30 9 * * MON-FRI`, six fields with seconds, and the `@daily`-style macros) parsed to Effect's `Cron`, equal to what `Cron.parse` gives for valid input, but failing with a positioned effect-parse `ParseError` that names the field. `parser`, `parserIn(timeZone)`, `parse`, `parseIn(input, timeZone)`, `format` and the `FromString` schema.
