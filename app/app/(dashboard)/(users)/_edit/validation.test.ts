import assert from "node:assert/strict";
import test from "node:test";

import { updateUserSchema } from "./validation";

test("administrator edits retain nullable fields, pending roles, and disabled status", () => {
  const input = {
    name: "",
    email: "Parent@Example.org",
    phone: null,
    photo_url: null,
    role: "unassigned",
    is_active: false,
    extra: "retained",
  };
  assert.deepEqual(updateUserSchema.parse(input), input);
  assert.deepEqual(updateUserSchema.parse({}), {});
});

test("administrator edits reject unknown roles and non-boolean status", () => {
  assert.equal(updateUserSchema.safeParse({ role: "owner" }).success, false);
  assert.equal(updateUserSchema.safeParse({ is_active: "false" }).success, false);
});
