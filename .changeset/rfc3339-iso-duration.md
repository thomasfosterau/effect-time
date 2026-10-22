---
"@thomasfosterau/effect-time": minor
---

Add `Rfc3339` and `IsoDuration`, built on `@thomasfosterau/effect-parse`. `Rfc3339` parses RFC 3339 date-times into `DateTime` values: `parser`, `parse`, `format` and the `FromString` schema. `IsoDuration` parses ISO 8601 durations into the amounts `DateTime.add` takes: `parser`, `parse`, `format`, `FromString` and `zero`. `@thomasfosterau/effect-parse` (`^0.1.0`) is a new peer dependency. The `effect` peer floor rises to `^4.0.0`, because effect-parse requires it.
