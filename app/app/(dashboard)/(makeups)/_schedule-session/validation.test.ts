import assert from "node:assert/strict";
import { test } from "node:test";

import { createSessionSchema } from "./validation";

test("makeup sessions accept both supported time formats", () => {
  const input = {
    student_id: "student",
    teacher_id: "teacher",
    site_id: "site",
    scheduled_date: "2026-10-11",
  };
  assert.equal(createSessionSchema.safeParse({ ...input, scheduled_time: "09:30" }).success, true);
  assert.equal(
    createSessionSchema.safeParse({ ...input, scheduled_time: "09:30:00" }).success,
    true,
  );
  assert.equal(createSessionSchema.safeParse({ ...input, scheduled_time: "9:30" }).success, false);
});
