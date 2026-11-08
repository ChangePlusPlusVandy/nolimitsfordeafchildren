import assert from "node:assert/strict";
import test from "node:test";

import { formatConflictMessage } from "./message";

test("conflict messages describe days and times without ids", () => {
  const message = formatConflictMessage([
    {
      id: "4f1c2d7e-0000-4000-8000-000000000000",
      day_of_week_mask: 74,
      start_time: "10:30",
      end_time: "11:30",
      cycle_start_date: "2026-09-01",
      cycle_end_date: "2026-12-15",
    },
  ]);

  assert.match(message, /^Schedule conflicts with existing schedules: /);
  assert.match(message, /Mon\/Wed\/Sat 10:30\sAM - 11:30\sAM \(Sep 1, 2026 to Dec 15, 2026\)/);
  assert.doesNotMatch(message, /4f1c2d7e/);
});
