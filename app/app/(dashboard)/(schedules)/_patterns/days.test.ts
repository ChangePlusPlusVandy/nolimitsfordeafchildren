import assert from "node:assert/strict";
import test from "node:test";

import { decodeDayMask, encodeDayMask, SCHEDULE_PATTERNS } from "./days";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAY_MASKS = 1 << DAYS.length;

test("every weekly mask retains its day order and round-trips", () => {
  for (let mask = 0; mask < ALL_DAY_MASKS; mask++) {
    const expected = DAYS.filter((_, index) => mask & (1 << index));
    assert.deepEqual(decodeDayMask(mask), expected);
    assert.equal(encodeDayMask(expected), mask);
  }
});

test("unknown days and out-of-week bits retain existing behavior", () => {
  assert.equal(encodeDayMask(["Mon", "Mon", "Unknown", "mon"]), 2);
  assert.deepEqual(decodeDayMask(ALL_DAY_MASKS), []);
  assert.deepEqual(decodeDayMask(-1), DAYS);
});

test("preset labels and masks stay stable", () => {
  assert.deepEqual(SCHEDULE_PATTERNS, {
    MWS: { label: "Mon/Wed/Sat", mask: 74 },
    TThS: { label: "Tue/Thu/Sat", mask: 84 },
  });
  assert.deepEqual(decodeDayMask(SCHEDULE_PATTERNS.MWS.mask), ["Mon", "Wed", "Sat"]);
  assert.deepEqual(decodeDayMask(SCHEDULE_PATTERNS.TThS.mask), ["Tue", "Thu", "Sat"]);
});
