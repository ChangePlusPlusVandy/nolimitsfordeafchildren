import assert from "node:assert/strict";
import test from "node:test";

import { linkStudentSchema } from "./validation";

test("links retain optional, nullable, and explicit false values", () => {
  assert.deepEqual(linkStudentSchema.parse({}), {});
  const input = { relationship: null, is_primary: false, extra: "retained" };
  assert.deepEqual(linkStudentSchema.parse(input), input);
  assert.deepEqual(linkStudentSchema.parse({ relationship: "", is_primary: true }), {
    relationship: "",
    is_primary: true,
  });
});

test("links enforce the existing relationship length and boolean flag", () => {
  const maxRelationshipLength = 100;
  assert.equal(
    linkStudentSchema.safeParse({ relationship: "x".repeat(maxRelationshipLength) }).success,
    true,
  );
  assert.equal(
    linkStudentSchema.safeParse({ relationship: "x".repeat(maxRelationshipLength + 1) }).success,
    false,
  );
  assert.equal(linkStudentSchema.safeParse({ is_primary: "true" }).success, false);
});
