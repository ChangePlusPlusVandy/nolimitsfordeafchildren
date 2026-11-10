import assert from "node:assert/strict";
import test from "node:test";

import { reviewDocumentSchema } from "./validation";

test("review validation preserves nullable notes and passthrough fields", () => {
  const input = { status: "rejected", review_notes: null, extra: "retained" };
  assert.deepEqual(reviewDocumentSchema.parse(input), input);
  assert.deepEqual(reviewDocumentSchema.parse({ status: "approved" }), { status: "approved" });
});

test("review validation rejects pending decisions and oversized notes", () => {
  assert.equal(reviewDocumentSchema.safeParse({ status: "pending" }).success, false);
  assert.equal(
    reviewDocumentSchema.safeParse({ status: "approved", review_notes: "a".repeat(2001) }).success,
    false,
  );
});
