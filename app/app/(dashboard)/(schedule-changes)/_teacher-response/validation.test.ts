import assert from "node:assert/strict";
import { test } from "node:test";

import { teacherResponseSchema } from "./validation";

test("teacher responses retain availability choices and notes", () => {
  for (const response_status of ["available", "unavailable", "conditional"]) {
    const input = { response_status, notes: "Please confirm the time" };
    assert.deepEqual(teacherResponseSchema.parse(input), input);
  }
  assert.equal(teacherResponseSchema.safeParse({ response_status: "approved" }).success, false);
});
