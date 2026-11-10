import assert from "node:assert/strict";
import test from "node:test";

import { createStudentSchema } from "./validation";

const student = { site_id: "site-1", first_name: "A", last_name: "B", dob: "2020-01-01" };

test("student creation retains nullable optional fields and passthrough data", () => {
  const input = { ...student, photo_url: null, guardian_summary: null, extra: "kept" };
  assert.deepEqual(createStudentSchema.parse(input), input);
});

test("student creation requires site and date format without changing name validation", () => {
  assert.equal(createStudentSchema.safeParse({ ...student, site_id: "" }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...student, dob: "01/01/2020" }).success, false);
  assert.equal(createStudentSchema.safeParse({ ...student, first_name: "" }).success, true);
});
