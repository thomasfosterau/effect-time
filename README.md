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
| `IsoDuration` | this package | Parsing and printing ISO 8601 durations: `parser`, `parse`, `format`, `FromString`, `zero`. |

The full reference for `Clock` and `DateTime` is Effect's own: the doc comments `effect` ships with `effect/Clock` and `effect/DateTime` (your editor's hover), and [effect.website](https://effect.website). `Rfc3339` and `IsoDuration` are documented below and in their doc comments.

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
