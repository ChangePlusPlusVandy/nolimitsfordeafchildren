import assert from "node:assert/strict";
import test from "node:test";

import { conflictCheckForUpdate } from "./scheduling";

const existing = {
  teacher_id: "teacher",
  day_of_week_mask: 74,
  start_time: "09:00",
  end_time: "10:00",
  cycle_start_date: "2026-01-01",
  cycle_end_date: "2026-03-11",
  is_active: true,
};

test("unchanged scheduling values skip the conflict check", () => {
  assert.equal(conflictCheckForUpdate("schedule", existing, {}), null);
  assert.equal(conflictCheckForUpdate("schedule", existing, { site_id: "other" }), null);
  assert.equal(
    conflictCheckForUpdate("schedule", existing, {
      day_of_week_mask: 74,
      start_time: "09:00:00",
      end_time: "10:00",
      cycle_start_date: "2026-01-01",
      cycle_end_date: "2026-03-11",
      is_active: true,
    }),
    null,
  );
});

test("deactivation skips the conflict check even when times change", () => {
  assert.equal(conflictCheckForUpdate("schedule", existing, { is_active: false }), null);
  assert.equal(
    conflictCheckForUpdate("schedule", existing, { is_active: false, end_time: "11:00" }),
    null,
  );
  assert.equal(
    conflictCheckForUpdate("schedule", { ...existing, is_active: false }, { end_time: "11:00" }),
    null,
  );
});

test("changed scheduling values check the resulting schedule", () => {
  assert.deepEqual(conflictCheckForUpdate("schedule", existing, { end_time: "10:15" }), {
    teacher_id: "teacher",
    day_of_week_mask: 74,
    start_time: "09:00",
    end_time: "10:15",
    cycle_start_date: "2026-01-01",
    cycle_end_date: "2026-03-11",
    exclude_schedule_id: "schedule",
  });
});

test("reactivation checks conflicts without other changes", () => {
  assert.equal(
    conflictCheckForUpdate("schedule", { ...existing, is_active: false }, { is_active: true })
      ?.exclude_schedule_id,
    "schedule",
  );
});
