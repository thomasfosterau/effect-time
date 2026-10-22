/**
 * Time for Effect applications: Effect's `Clock` service and `DateTime`
 * values under one import.
 *
 * Read the current time through `Clock` (so a test can swap in `TestClock`)
 * and do calendar arithmetic, formatting and time-zone conversion on
 * `DateTime` values, never on the global `Date`.
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
