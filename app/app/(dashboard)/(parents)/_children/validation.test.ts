import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parentHearingInfoSchema,
  parentSiblingAddSchema,
  parentSiblingUpdateSchema,
} from "./validation";

// Cross-family regression: schema must strip student_id so a crafted payload
// cannot move a sibling to another family's student record via .set().
test("parentSiblingUpdateSchema strips student_id and other unknown fields", () => {
  const input = {
    name: "Sam",
    relationship: "brother",
    student_id: "other-family-student-id",
    extra_column: "injected",
  };
  const parsed = parentSiblingUpdateSchema.parse(input);
  assert.equal("student_id" in parsed, false, "student_id must be stripped");
  assert.equal("extra_column" in parsed, false, "unknown fields must be stripped");
  assert.equal(parsed.name, "Sam");
});

test("parentSiblingAddSchema strips student_id and unknown fields", () => {
  const input = {
    name: "Alex",
    relationship: "sister",
    student_id: "other-family-student-id",
  };
  const parsed = parentSiblingAddSchema.parse(input);
  assert.equal("student_id" in parsed, false, "student_id must be stripped");
  assert.equal(parsed.name, "Alex");
});

// Cross-family regression: hearing-info action must not accept sensitive
// student fields that UpdateStudentService would persist (e.g. site_id moves
// the child between locations; is_active deactivates them).
test("parentHearingInfoSchema rejects sensitive student fields", () => {
  const validBase = {
    hearing_devices: ["Hearing Aid"],
    hearing_loss_type: "mild" as const,
  };

  assert.equal(parentHearingInfoSchema.safeParse(validBase).success, true);

  assert.equal(
    parentHearingInfoSchema.safeParse({ ...validBase, is_active: false }).success,
    false,
    "is_active must be rejected",
  );

  assert.equal(
    parentHearingInfoSchema.safeParse({ ...validBase, site_id: "another-location" }).success,
    false,
    "site_id must be rejected",
  );

  assert.equal(
    parentHearingInfoSchema.safeParse({ ...validBase, first_name: "Hacked" }).success,
    false,
    "first_name must be rejected",
  );
});

test("cross-family ownership guard: sibling.student_id must match authorized studentId", () => {
  // Documents the invariant checked in updateChildSibling / removeChildSibling.
  // DB-bound path is covered by the assertParentOwnsChild + getSiblingById guard;
  // this test pins the logical condition.
  function isOwnedByStudent(siblingStudentId: string, authorizedStudentId: string): boolean {
    return siblingStudentId === authorizedStudentId;
  }

  assert.equal(
    isOwnedByStudent("student-B", "student-A"),
    false,
    "sibling from another family must not pass",
  );
  assert.equal(
    isOwnedByStudent("student-A", "student-A"),
    true,
    "sibling from own family must pass",
  );
});
