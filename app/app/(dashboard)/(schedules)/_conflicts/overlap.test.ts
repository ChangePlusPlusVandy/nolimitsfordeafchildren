import assert from "node:assert/strict";
import test from "node:test";

import type { ConflictCheckInput, ConflictResult } from "../_domain/types";
import { findConflicts } from "./overlap";

const input: ConflictCheckInput = {
  teacher_id: "teacher",
  day_of_week_mask: 74,
  start_time: "09:00",
  end_time: "10:00",
  cycle_start_date: "2026-01-01",
  cycle_end_date: "2026-03-11",
};

const schedule: ConflictResult["conflicts"][number] = {
  id: "schedule",
  day_of_week_mask: input.day_of_week_mask,
  start_time: input.start_time,
  end_time: input.end_time,
  cycle_start_date: input.cycle_start_date,
  cycle_end_date: input.cycle_end_date,
};

test("conflicts require overlapping days, dates, and times", () => {
  assert.deepEqual(findConflicts(input, [schedule]), { hasConflict: true, conflicts: [schedule] });

  for (const candidate of [
    { ...schedule, day_of_week_mask: 4 },
    { ...schedule, cycle_start_date: "2026-03-12", cycle_end_date: "2026-04-01" },
    { ...schedule, cycle_start_date: "2025-12-01", cycle_end_date: "2025-12-31" },
    { ...schedule, start_time: "10:00", end_time: "11:00" },
    { ...schedule, start_time: "08:00", end_time: "09:00" },
  ]) {
    assert.deepEqual(findConflicts(input, [candidate]), { hasConflict: false, conflicts: [] });
  }
});

test("cycle boundaries are inclusive and partial day masks overlap", () => {
  const candidates = [
    { ...schedule, id: "first", day_of_week_mask: 2, cycle_end_date: input.cycle_start_date },
    { ...schedule, id: "last", day_of_week_mask: 64, cycle_start_date: input.cycle_end_date },
  ];
  assert.deepEqual(findConflicts(input, candidates), { hasConflict: true, conflicts: candidates });
});

test("conflicts preserve ordering and omit unrelated record fields", () => {
  const candidate = { ...schedule, teacher_id: "teacher", is_active: true };
  assert.deepEqual(findConflicts(input, [candidate]), { hasConflict: true, conflicts: [schedule] });
  assert.deepEqual(findConflicts(input, []), { hasConflict: false, conflicts: [] });
});
