/**
 * Time for Effect applications: Effect's `Clock` service and `DateTime`
 * values under one import.
 *
 * Read the current time through `Clock` (so a test can swap in `TestClock`)
 * and do calendar arithmetic, formatting and time-zone conversion on
 * `DateTime` values, never on the global `Date`. Parse RFC 3339 timestamps
 * and ISO 8601 durations into those values with `Rfc3339` and `IsoDuration`,
 * RFC 9557 time zone and annotation suffixes with `Rfc9557`, POSIX TZ
 * strings (`EST5EDT,M3.2.0,M11.1.0`) with `PosixTz`, cron expressions into
 * Effect's `Cron` with `CronExpression`, and iCalendar recurrence rules
 * (`FREQ=WEEKLY;BYDAY=MO`) with `RRule`.
 *
 * @since 0.1.0
 */

/**
 * The `Clock` service: the current time as an effect, so code that reads it
 * stays deterministic under `TestClock`.
 *
 * Re-exports `effect/Clock` unchanged; see Effect's documentation for the full
 * module.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as TestClock from "effect/testing/TestClock"
 * import { Clock } from "@thomasfosterau/effect-time"
 *
 * const program = Effect.gen(function*() {
 *   yield* TestClock.setTime(1_700_000_000_000)
 *   return yield* Clock.currentTimeMillis
 * })
 *
 * Effect.runPromise(program.pipe(Effect.provide(TestClock.layer()))).then(
 *   (millis) => console.log(millis) // 1700000000000
 * )
 * ```
 *
 * @category modules
 * @since 0.1.0
 */
export * as Clock from "effect/Clock";

/**
 * Immutable instants, in UTC or in a time zone: construction, comparison,
 * calendar arithmetic and formatting without the global `Date`.
 *
 * Re-exports `effect/DateTime` unchanged; see Effect's documentation for the
 * full module.
 *
 * @example
 * ```ts
 * import { DateTime } from "@thomasfosterau/effect-time"
 *
 * const start = DateTime.makeUnsafe("2026-01-31T00:00:00Z")
 * const next = DateTime.add(start, { months: 1 })
 *
 * console.log(DateTime.formatIso(next)) // "2026-02-28T00:00:00.000Z"
 * ```
 *
 * @category modules
 * @since 0.1.0
 */
export * as DateTime from "effect/DateTime";

/**
 * RFC 3339 date-times (`2026-10-22T09:30:00+10:00`) parsed to and printed from
 * `DateTime` values: a parser to compose, an effectful decoder and a `Schema`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Rfc3339 } from "@thomasfosterau/effect-time"
 *
 * Effect.runPromise(Rfc3339.parse("2026-10-22T09:30:00+10:00")).then((dt) =>
 *   console.log(Rfc3339.format(dt)) // "2026-10-22T09:30:00.000+10:00"
 * )
 * ```
 *
 * @category modules
 * @since 0.1.0
 */
export * as Rfc3339 from "./Rfc3339.ts";

/**
 * RFC 9557 extended date-times (`2026-10-22T09:30:00+11:00[Australia/Sydney]`):
 * an RFC 3339 date-time with a time zone and tagged annotations in brackets,
 * as a parser to compose, an effectful decoder, a printer and a `Schema`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Rfc3339, Rfc9557 } from "@thomasfosterau/effect-time"
 *
 * Effect.runPromise(Rfc9557.parse("2026-10-22T00:00:00Z[Australia/Sydney]")).then((ixdtf) =>
 *   console.log(Rfc3339.format(Rfc9557.toDateTime(ixdtf))) // "2026-10-22T11:00:00.000+11:00"
 * )
 * ```
 *
 * @category modules
 * @since 0.1.0
 */
export * as Rfc9557 from "./Rfc9557.ts";

/**
 * ISO 8601 durations (`P1Y2M3DT4H5M6S`, `P2W`) parsed to and printed from the
 * amounts `DateTime.add` takes: a parser to compose, an effectful decoder, a
 * printer and a `Schema`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { IsoDuration } from "@thomasfosterau/effect-time"
 *
 * Effect.runPromise(IsoDuration.parse("P2W")).then((duration) =>
 *   console.log(duration.weeks) // 2
 * )
 * ```
 *
 * @category modules
 * @since 0.1.0
 */
export * as IsoDuration from "./IsoDuration.ts";

/**
 * POSIX TZ strings (`EST5EDT,M3.2.0,M11.1.0`), the `TZ` environment variable
 * format and the footer of a TZif file: standard and daylight designations
 * with their UTC offsets and the daylight saving rule, as a parser to
 * compose, an effectful decoder, a printer and a `Schema`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { PosixTz } from "@thomasfosterau/effect-time"
 *
 * Effect.runPromise(PosixTz.parse("NZST-12NZDT,M9.5.0,M4.1.0/3")).then((tz) =>
 *   console.log(tz.std.utcOffset / 3600) // 12
 * )
 * ```
 *
 * @category modules
 * @since 0.1.0
 */
export * as PosixTz from "./PosixTz.ts";

/**
 * Cron expressions (`30 9 * * MON-FRI`, `@daily`) parsed to Effect's `Cron`
 * values with errors that name the field and column, as a parser to
 * compose, an effectful decoder, a printer and a `Schema`.
 *
 * @example
 * ```ts
 * import { Cron, Effect } from "effect"
 * import { CronExpression } from "@thomasfosterau/effect-time"
 *
 * Effect.runPromise(CronExpression.parse("@daily")).then((cron) =>
 *   console.log(Cron.format(cron)) // "0 0 * * *"
 * )
 * ```
 *
 * @category modules
 * @since 0.1.0
 */
export * as CronExpression from "./CronExpression.ts";

/**
 * iCalendar recurrence rules (`FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10`), the
 * RFC 5545 `recur` value of an `RRULE` property, with RFC 5545's
 * cross-part restrictions, as a parser to compose, an effectful decoder, a
 * printer and a `Schema`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { RRule } from "@thomasfosterau/effect-time"
 *
 * Effect.runPromise(RRule.parse("FREQ=DAILY;INTERVAL=2")).then((rule) =>
 *   console.log(rule.interval) // 2
 * )
 * ```
 *
 * @category modules
 * @since 0.1.0
 */
export * as RRule from "./RRule.ts";
