import assert from "node:assert/strict";
import test from "node:test";

import { acknowledgeSchema } from "./validation";

test("initials validation leaves normalization to the service", () => {
  assert.deepEqual(acknowledgeSchema.parse({ initials: " ab ", extra: true }), {
    initials: " ab ",
    extra: true,
  });
});

test("initials validation retains the one-to-eight character limit", () => {
  assert.equal(acknowledgeSchema.safeParse({ initials: "" }).success, false);
  assert.equal(acknowledgeSchema.safeParse({ initials: "ABCDEFGH" }).success, true);
  assert.equal(acknowledgeSchema.safeParse({ initials: "ABCDEFGHI" }).success, false);
});
