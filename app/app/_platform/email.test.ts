import assert from "node:assert/strict";
import { test } from "node:test";

import { isEmailConfigured } from "./email";

test("email is disabled without a verified from address", () => {
  const original = process.env.EMAIL_FROM_ADDRESS;
  delete process.env.EMAIL_FROM_ADDRESS;

  try {
    assert.equal(isEmailConfigured(), false);
  } finally {
    if (original === undefined) {
      delete process.env.EMAIL_FROM_ADDRESS;
    } else {
      process.env.EMAIL_FROM_ADDRESS = original;
    }
  }
});
