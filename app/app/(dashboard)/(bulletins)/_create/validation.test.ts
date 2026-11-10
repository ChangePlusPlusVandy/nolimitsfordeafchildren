import assert from "node:assert/strict";
import test from "node:test";

import { createBulletinSchema } from "./validation";

const bulletin = {
  title: "Schedule update",
  scope: "site",
  site_id: "site-id",
  role_target: "parent",
};

test("bulletin validation preserves optional fields and passthrough values", () => {
  const input = {
    ...bulletin,
    publish_at: new Date("2026-10-11T12:00:00Z"),
    expire_at: null,
    requires_initials: true,
    extra: "retained",
  };

  assert.deepEqual(createBulletinSchema.parse(input), input);
  assert.equal(createBulletinSchema.parse(bulletin).requires_approval, undefined);
});

test("bulletin validation rejects unknown scopes and audiences", () => {
  assert.equal(createBulletinSchema.safeParse({ ...bulletin, scope: "regional" }).success, false);
  assert.equal(
    createBulletinSchema.safeParse({ ...bulletin, role_target: "unassigned" }).success,
    false,
  );
});
