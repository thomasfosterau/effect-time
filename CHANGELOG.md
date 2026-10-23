# @thomasfosterau/effect-time

## 0.1.0

### Minor Changes

- [#2](https://github.com/thomasfosterau/effect-time/pull/2) [`f98567c`](https://github.com/thomasfosterau/effect-time/commit/f98567ce20cf46d77e1232dc4210a64fa38de882) Thanks [@thomasfosterau](https://github.com/thomasfosterau)! - First release: `Clock` and `DateTime`, Effect's own modules re-exported under one import, built to `dist/` with `exports` and declarations, `effect` as a peer. The `Date` re-export is gone: `effect/Date` does not exist in any Effect 4 release, so it never resolved.

- [#3](https://github.com/thomasfosterau/effect-time/pull/3) [`5321689`](https://github.com/thomasfosterau/effect-time/commit/5321689a2b46119e4195dd13e820b501d45bb632) Thanks [@thomasfosterau](https://github.com/thomasfosterau)! - Add `Rfc3339` and `IsoDuration`, built on `@thomasfosterau/effect-parse`. `Rfc3339` parses RFC 3339 date-times into `DateTime` values: `parser`, `parse`, `format` and the `FromString` schema. `IsoDuration` parses ISO 8601 durations into the amounts `DateTime.add` takes: `parser`, `parse`, `format`, `FromString` and `zero`. `@thomasfosterau/effect-parse` (`^0.1.0`) is a new peer dependency. The `effect` peer floor rises to `^4.0.0`, because effect-parse requires it.

- [#4](https://github.com/thomasfosterau/effect-time/pull/4) [`2923c5f`](https://github.com/thomasfosterau/effect-time/commit/2923c5f8a64c1346529bb1727663eb552ed20b28) Thanks [@thomasfosterau](https://github.com/thomasfosterau)! - Add `Rfc9557`: RFC 9557 Internet Extended Date/Time Format (IXDTF) date-times, an RFC 3339 date-time with a time zone suffix (`[Europe/Paris]`, `[+05:30]`) and tagged annotations (`[u-ca=hebrew]`). `parser`, `parse`, `format` and the `FromString` schema read and print an `Ixdtf` record, and `toDateTime` views its instant in the suffixed time zone. A critical (`!`) time zone that is unknown or inconsistent with the written offset fails the parse.
