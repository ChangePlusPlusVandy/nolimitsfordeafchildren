import assert from "node:assert/strict";
import { test } from "node:test";

import { reviewRequestSchema } from "./validation";

test("review accepts negotiating but not completed or pending", () => {
  for (const status of ["approved", "denied", "negotiating"]) {
    assert.equal(reviewRequestSchema.safeParse({ status }).success, true);
  }
  for (const status of ["pending", "completed"]) {
    assert.equal(reviewRequestSchema.safeParse({ status }).success, false);
  }
});
