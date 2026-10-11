import assert from "node:assert/strict";
import { test } from "node:test";

import { createRequestSchema } from "./validation";

const request = {
  student_id: "student",
  original_schedule_id: "schedule",
  original_session_date: "2026-10-11",
  reason: "sick",
};

test("makeup requests retain optional fields and passthrough semantics", () => {
  const input = { ...request, reason_text: "Resting", preferred_dates: "Saturday", extra: "kept" };
  assert.deepEqual(createRequestSchema.parse(input), input);
});

test("makeup requests reject unsupported reasons and date formats", () => {
  assert.equal(createRequestSchema.safeParse({ ...request, reason: "unknown" }).success, false);
  assert.equal(
    createRequestSchema.safeParse({ ...request, original_session_date: "10/11/2026" }).success,
    false,
  );
  assert.equal(createRequestSchema.safeParse({ ...request, student_id: "" }).success, false);
});
