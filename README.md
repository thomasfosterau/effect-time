# @thomasfosterau/effect-time

Time for [Effect](https://effect.website) applications: Effect's `Clock` service and `DateTime` values under one import, with parsers for the strings time travels in.

Read the current time through `Clock`, so a test can replace it with `TestClock`, and do calendar arithmetic, formatting and time-zone conversion on immutable `DateTime` values instead of the global `Date`. Both modules are Effect's own, re-exported unchanged: a `Clock` from here is the service `TestClock` replaces, and a `DateTime` from here is accepted everywhere `effect/DateTime` is.

`Rfc3339` and `IsoDuration` parse RFC 3339 timestamps into `DateTime` values and ISO 8601 durations into the amounts `DateTime.add` takes, with errors that point at the offending field. They are built on [`@thomasfosterau/effect-parse`](https://www.npmjs.com/package/@thomasfosterau/effect-parse), and each comes as a parser to compose, an effectful decoder and a `Schema`.

## Install

```sh
pnpm add @thomasfosterau/effect-time effect @thomasfosterau/effect-parse
```

`effect` (`^4.0.0`) and `@thomasfosterau/effect-parse` (`^0.1.0`) are peer dependencies: your application owns the single copy of each. The package is ESM-only and has no other dependencies.

## API

| Export | Is | Use it for |
| --- | --- | --- |
| `Clock` | `effect/Clock` | Reading the current time as an effect (`currentTimeMillis`, `currentTimeNanos`, `clockWith`). |
| `DateTime` | `effect/DateTime` | Constructing, comparing, adding to, formatting and converting instants in UTC or a time zone. |
| `Rfc3339` | this package | Parsing and printing RFC 3339 date-times: `parser`, `parse`, `format`, `FromString`. |
| `Rfc9557` | this package | Parsing and printing RFC 9557 (IXDTF) date-times with time zone and annotation suffixes: `parser`, `parse`, `toDateTime`, `format`, `FromString`. |
| `PosixTz` | this package | Parsing and printing POSIX TZ strings (`EST5EDT,M3.2.0,M11.1.0`): `parser`, `parse`, `format`, `FromString`. |
| `CronExpression` | this package | Parsing cron expressions (`30 9 * * MON-FRI`, `@daily`) to Effect's `Cron`, with positioned errors: `parser`, `parserIn`, `parse`, `parseIn`, `format`, `FromString`. |
| `IsoDuration` | this package | Parsing and printing ISO 8601 durations: `parser`, `parse`, `format`, `FromString`, `zero`. |

The full reference for `Clock` and `DateTime` is Effect's own: the doc comments `effect` ships with `effect/Clock` and `effect/DateTime` (your editor's hover), and [effect.website](https://effect.website). `Rfc3339`, `Rfc9557`, `PosixTz`, `CronExpression` and `IsoDuration` are documented below and in their doc comments.

### `Clock`

```ts
import { Effect } from "effect";
import * as TestClock from "effect/testing/TestClock";
import { Clock } from "@thomasfosterau/effect-time";

const program = Effect.gen(function* () {
  yield* TestClock.setTime(1_700_000_000_000);
  return yield* Clock.currentTimeMillis;
});

Effect.runPromise(program.pipe(Effect.provide(TestClock.layer()))).then(
  (millis) => console.log(millis), // 1700000000000
);
```

In production nothing needs providing: the default `Clock` reads the system time.

### `DateTime`

```ts
import { DateTime } from "@thomasfosterau/effect-time";

const start = DateTime.makeUnsafe("2026-01-31T00:00:00Z");
const next = DateTime.add(start, { months: 1 });

console.log(DateTime.formatIso(next)); // "2026-02-28T00:00:00.000Z"
```

`DateTime.now` reads the time through `Clock`, so it is deterministic under `TestClock` too:

```ts
import { Effect } from "effect";
import { DateTime } from "@thomasfosterau/effect-time";

const today = Effect.gen(function* () {
  const now = yield* DateTime.now;
  return DateTime.formatIso(DateTime.startOf(now, "day"));
});
```

Convert at the edges: `DateTime.make(date)` from a JavaScript `Date` (it returns an `Option`, `None` for an invalid date), `DateTime.toDateUtc` back to one.

### `Rfc3339`

```ts
import { Effect, Schema } from "effect";
import { DateTime, Rfc3339 } from "@thomasfosterau/effect-time";

// An effect that fails with effect-parse's ParseError.
const program = Effect.map(Rfc3339.parse("2026-10-22T09:30:00+10:00"), DateTime.formatIso);
// "2026-10-21T23:30:00.000Z"

// A Schema<DateTime, string>; a failure's issue carries the ParseError message.
const Event = Schema.Struct({ at: Rfc3339.FromString });
```

The grammar is RFC 3339's `date-time`. The separator may be `T`, `t` or a space, and the offset `Z`, `z` or `±hh:mm`. It checks the calendar (`2026-02-29` fails) and the clock ranges, and the error names the field that is out of range:

```text
Parse error at line 1, column 9:
1 | 2026-02-30T00:00:00Z
  |         ^
while parsing RFC 3339 date-time
expected day of month (01-28), found "3"
```

`Z` and `-00:00` (UTC, local offset unknown) give a `DateTime.Utc`. Any other offset gives a `DateTime.Zoned` in that fixed offset, so `Rfc3339.format` prints it back unchanged. Fractional seconds are truncated to milliseconds. A leap second (`:60`) is rejected because `DateTime` cannot hold it. `Rfc3339.parser` is the effect-parse `Parser`, for embedding a timestamp in a larger grammar.

### `Rfc9557`

```ts
import { Effect } from "effect";
import { Rfc3339, Rfc9557 } from "@thomasfosterau/effect-time";

const program = Effect.map(
  Rfc9557.parse("2026-10-22T00:00:00Z[Australia/Sydney][u-ca=gregory]"),
  (ixdtf) => Rfc3339.format(Rfc9557.toDateTime(ixdtf)),
);
// "2026-10-22T11:00:00.000+11:00"
```

The grammar is RFC 9557's `date-time-ext`: an RFC 3339 date-time (read by `Rfc3339.parser`), then at most one time zone suffix (`[Europe/Paris]`, `[+05:30]`), then any number of annotations (`[u-ca=hebrew]`, `[_x-key=a-b]`). A suffix starting with `!` is critical. The result is an `Ixdtf`: the instant as the written offset fixes it, the time zone suffix (`Option`) and the annotations, as written. `Rfc9557.toDateTime` views the instant in the suffixed time zone when `DateTime` knows it.

Following RFC 9557 §3.4, a critical time zone that `DateTime` does not know, or whose offset at the instant differs from a numeric written offset, fails the parse; an elective one is kept as written. Critical annotations are reported with `critical: true` and never acted on: an application must reject the critical keys it does not understand itself. `Rfc9557.format` prints an `Ixdtf` back, and `Rfc9557.FromString` is the `Schema` from the string.

### `PosixTz`

```ts
import { Effect, Option } from "effect";
import { PosixTz } from "@thomasfosterau/effect-time";

const program = Effect.map(PosixTz.parse("AEST-10AEDT,M10.1.0,M4.1.0/3"), (tz) => ({
  standard: tz.std.utcOffset, // 36000: ten hours east of UTC
  daylight: Option.map(tz.dst, (dst) => dst.utcOffset), // Option.some(39600)
}));
```

The grammar is POSIX.1-2017 §8.3's `std offset [dst [offset] [,start[/time],end[/time]]]`, the `TZ` environment variable format and the footer of a TZif file. A designation is three or more letters (`AEST`) or three or more letters, digits, `+` and `-` in angle brackets (`<+1030>`). POSIX writes offsets positive _west_ of Greenwich (`EST5`); a parsed `Designation` stores `utcOffset` in seconds positive _east_, as ISO 8601 and `DateTime` do. A daylight designation without an offset is one hour ahead of standard time. Rule dates are `Jn` (1–365, never counting February 29), `n` (0–365) or `Mm.w.d` (week 5 is the last), each with an optional `/time` from -167 to 167 hours (the RFC 8536 extension), defaulting to 02:00. A string with a daylight designation but no rule (`EST5EDT`) gives `rule: Option.none()`, since POSIX leaves that rule to the implementation, and the implementation-defined `:name` form is not read. `PosixTz.format` prints a `PosixTz` back, leaving out the defaults, and `PosixTz.FromString` is the `Schema` from the string.

### `CronExpression`

```ts
import { Cron, DateTime, Effect } from "effect";
import { CronExpression } from "@thomasfosterau/effect-time";

const nextRun = Effect.map(
  CronExpression.parseIn("0 9 * * MON-FRI", DateTime.zoneMakeNamedUnsafe("Australia/Sydney")),
  (cron) => Cron.next(cron, DateTime.makeUnsafe("2026-10-24T00:00:00Z")),
);
// 2026-10-25T22:00:00.000Z, 9:00 on Monday in Sydney
```

The result is Effect's own `Cron`, so `Cron.next`, `Cron.match` and `Cron.sequence` work on it, and for a valid expression it equals what `Cron.parse` gives. What this module adds is the error: a value out of range, a range that runs backwards, a zero step or a wrong field count fails at its column and names the field, as an effect-parse `ParseError`. The grammar is Vixie cron's: five fields (minute, hour, day of month, month, day of week) or six with a leading second, each a comma-separated list of `*`, `n` or `a-b` with an optional `/step`, month and weekday names in any case, Sunday as 0 or 7, and the macros `@yearly`, `@annually`, `@monthly`, `@weekly`, `@daily`, `@midnight` and `@hourly`. When both day fields are restricted a time matches either, unless one starts with `*`. Quartz's `?`, `L`, `W` and `#` are not read. `CronExpression.parseIn` and `CronExpression.parserIn` take a time zone, `CronExpression.format` prints with `Cron.format`, and `CronExpression.FromString` is the `Schema` from the string.

### `IsoDuration`

```ts
import { Effect, Option } from "effect";
import { DateTime, IsoDuration } from "@thomasfosterau/effect-time";

const later = Effect.map(IsoDuration.parse("P1DT12H"), (duration) =>
  DateTime.add(DateTime.makeUnsafe("2026-10-22T00:00:00Z"), duration),
);

IsoDuration.format({ days: 1, milliseconds: 1500 }); // Option.some("P1DT1.5S")
IsoDuration.format({ days: 1, hours: -1 }); // Option.none(): mixed signs
```

A parsed duration is every amount `DateTime.add` takes (`years` through `milliseconds`), unnormalised: `PT90M` is 90 minutes. The grammar is `PnW`, or `PnYnMnDTnHnMnS` with any amounts left out (at least one, and at least one after a `T`). It also accepts a leading sign, a `.` or `,` fraction on the seconds (truncated to milliseconds) and lower-case letters. `IsoDuration.FromString` is the `Schema` from the string.

## Links

- [Changelog](https://github.com/thomasfosterau/effect-time/blob/trunk/CHANGELOG.md)
- [Contributing](https://github.com/thomasfosterau/effect-time/blob/trunk/CONTRIBUTING.md)
- [Security policy](https://github.com/thomasfosterau/effect-time/blob/trunk/SECURITY.md)

## License

[MIT](https://github.com/thomasfosterau/effect-time/blob/trunk/LICENSE.md)
