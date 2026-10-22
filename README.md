# @thomasfosterau/effect-time

Time for [Effect](https://effect.website) applications: Effect's `Clock` service and `DateTime` values under one import.

Read the current time through `Clock`, so a test can replace it with `TestClock`, and do calendar arithmetic, formatting and time-zone conversion on immutable `DateTime` values instead of the global `Date`. Both modules are Effect's own, re-exported unchanged: a `Clock` from here is the service `TestClock` replaces, and a `DateTime` from here is accepted everywhere `effect/DateTime` is.

## Install

```sh
pnpm add @thomasfosterau/effect-time effect
```

`effect` is a peer dependency (`>=4.0.0-rc.118`): your application owns the single copy. The package is ESM-only and has no other dependencies.

## API

| Export | Is | Use it for |
| --- | --- | --- |
| `Clock` | `effect/Clock` | Reading the current time as an effect (`currentTimeMillis`, `currentTimeNanos`, `clockWith`). |
| `DateTime` | `effect/DateTime` | Constructing, comparing, adding to, formatting and converting instants in UTC or a time zone. |

The full reference for each module is Effect's own: the doc comments `effect` ships with `effect/Clock` and `effect/DateTime` (your editor's hover), and [effect.website](https://effect.website).

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

## Links

- [Changelog](https://github.com/thomasfosterau/effect-time/blob/trunk/CHANGELOG.md)
- [Contributing](https://github.com/thomasfosterau/effect-time/blob/trunk/CONTRIBUTING.md)
- [Security policy](https://github.com/thomasfosterau/effect-time/blob/trunk/SECURITY.md)

## License

[MIT](https://github.com/thomasfosterau/effect-time/blob/trunk/LICENSE.md)
