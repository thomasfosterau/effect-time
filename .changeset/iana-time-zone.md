---
"@thomasfosterau/effect-time": minor
---

Add `IanaTimeZone`: IANA time zone names (`Europe/Paris`) read with the tz database's naming rules and checked against the time zones the JavaScript runtime knows, with no bundled data. The answer depends on the runtime's ICU build. `parser`, `parse`, `known`, `isKnown`, `supported` (`Intl.supportedValuesOf("timeZone")`) and the `FromString` schema, decoding to the runtime's `DateTime.TimeZone.Named`.
