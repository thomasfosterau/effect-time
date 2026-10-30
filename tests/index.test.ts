/**
 * The published surface: `Clock` and `DateTime` resolve to Effect's own
 * modules, so a consumer's `Clock` reads the same service a `TestClock`
 * replaces and a `DateTime` value is the one `effect/DateTime` accepts.
 */

import { describe, expect, it } from "vite-plus/test";
import { Effect } from "effect";
import * as EffectClock from "effect/Clock";
import * as EffectDateTime from "effect/DateTime";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as TestClock from "effect/testing/TestClock";
import { Clock, DateTime } from "@thomasfosterau/effect-time";

describe("Clock", () => {
  it("is effect/Clock", () => {
    expect(Clock).toBe(EffectClock);
  });

  it("reads the TestClock in place of the wall clock", () => {
    // The test is the entry point, so the TestClock layer is built into a
    // runtime here rather than provided inside the program.
    const runtime = ManagedRuntime.make(TestClock.layer());
    return runtime
      .runPromise(
        Effect.gen(function* () {
          yield* TestClock.setTime(1_700_000_000_000);
          return yield* Clock.currentTimeMillis;
        }),
      )
      .finally(() => runtime.dispose())
      .then((millis) => {
        expect(millis).toBe(1_700_000_000_000);
      });
  });
});

describe("DateTime", () => {
  it("is effect/DateTime", () => {
    expect(DateTime).toBe(EffectDateTime);
  });

  it("clamps month arithmetic to the end of the month", () => {
    const next = DateTime.add(DateTime.makeUnsafe("2026-01-31T00:00:00Z"), { months: 1 });
    expect(DateTime.formatIso(next)).toBe("2026-02-28T00:00:00.000Z");
  });
});
