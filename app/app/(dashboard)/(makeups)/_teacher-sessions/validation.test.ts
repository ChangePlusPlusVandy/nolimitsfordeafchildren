import assert from "node:assert/strict";
import { test } from "node:test";

import { markAttendanceSchema } from "./validation";

test("makeup attendance retains the four supported statuses", () => {
  for (const status of ["present", "late", "no_show", "cancelled"]) {
    assert.deepEqual(markAttendanceSchema.parse({ status }), { status });
  }
  assert.equal(markAttendanceSchema.safeParse({ status: "absent" }).success, false);
});
