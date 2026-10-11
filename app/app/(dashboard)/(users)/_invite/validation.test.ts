import assert from "node:assert/strict";
import test from "node:test";

import { USER_ROLES } from "../_domain/types";
import { inviteUserSchema } from "./validation";

test("invitations accept every existing role without normalizing the email", () => {
  for (const role of USER_ROLES) {
    const input = { email: "Parent@Example.org", name: "Parent", role };
    assert.deepEqual(inviteUserSchema.parse(input), input);
  }
});

test("invitations retain nullable contact fields and passthrough data", () => {
  const input = {
    email: "parent@example.org",
    name: "Parent",
    role: "parent",
    phone: null,
    primary_site_id: "site-id",
    extra: "retained",
  };
  assert.deepEqual(inviteUserSchema.parse(input), input);
});

test("invitations reject missing identity, invalid email, and unknown roles", () => {
  const input = { email: "parent@example.org", name: "Parent", role: "parent" };
  for (const change of [{ name: "" }, { email: "invalid" }, { role: "owner" }]) {
    assert.equal(inviteUserSchema.safeParse({ ...input, ...change }).success, false);
  }
});
