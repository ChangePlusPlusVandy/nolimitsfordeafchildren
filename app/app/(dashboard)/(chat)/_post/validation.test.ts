import assert from "node:assert/strict";
import test from "node:test";

import { createMessageSchema } from "./validation";

test("chat validation retains both channels and optional announcement flags", () => {
  for (const channel of ["community", "teacher"]) {
    const input = { channel, message: " Staff update ", extra: "retained" };
    assert.deepEqual(createMessageSchema.parse(input), input);
  }
});

test("chat validation rejects invalid channels and oversized messages", () => {
  assert.equal(
    createMessageSchema.safeParse({ channel: "parent", message: "Hello" }).success,
    false,
  );
  assert.equal(createMessageSchema.safeParse({ channel: "community", message: "" }).success, false);
  assert.equal(
    createMessageSchema.safeParse({ channel: "teacher", message: "a".repeat(2001) }).success,
    false,
  );
  assert.equal(
    createMessageSchema.safeParse({ channel: "teacher", message: "Hello", is_announcement: "true" })
      .success,
    false,
  );
});
