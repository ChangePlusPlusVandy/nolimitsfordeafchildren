import assert from "node:assert/strict";
import { test } from "node:test";

import { reviewRequestSchema } from "./validation";

test("makeup reviews accept only approved or denied", () => {
  for (const status of ["approved", "denied"]) {
    const input = { status, review_notes: "Reviewed" };
    assert.deepEqual(reviewRequestSchema.parse(input), input);
  }
  assert.equal(reviewRequestSchema.safeParse({ status: "negotiating" }).success, false);
});
