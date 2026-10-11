import assert from "node:assert/strict";
import test from "node:test";

import { updateStudentSchema } from "./validation";

test("student updates remain partial and preserve empty hearing-device arrays", () => {
  assert.deepEqual(updateStudentSchema.parse({}), {});
  const input = { hearing_devices: [], is_active: false, photo_url: null, extra: "kept" };
  assert.deepEqual(updateStudentSchema.parse(input), input);
  assert.equal(updateStudentSchema.safeParse({ is_active: "false" }).success, false);
});
