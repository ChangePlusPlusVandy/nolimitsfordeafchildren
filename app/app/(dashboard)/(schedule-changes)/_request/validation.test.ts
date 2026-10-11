import assert from "node:assert/strict";
import { test } from "node:test";

import { createRequestSchema } from "./validation";

test("schedule changes support flexible requests without a target schedule", () => {
  const input = {
    student_id: "student",
    current_schedule_id: "current",
    reason: "Transportation",
    preferred_times: "Saturday",
    extra: "kept",
  };
  assert.deepEqual(createRequestSchema.parse(input), input);
  assert.equal(createRequestSchema.safeParse({ ...input, reason: "" }).success, false);
});
