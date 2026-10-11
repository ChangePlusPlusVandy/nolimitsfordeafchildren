import assert from "node:assert/strict";
import test from "node:test";

import type { UserProfileWithIds } from "../_domain/types";
import { profileResponse } from "./response";

function profile(): UserProfileWithIds {
  return {
    id: "user-id",
    authUserId: "auth-id",
    email: "parent@example.org",
    name: "Parent",
    phone: null,
    photo_url: null,
    locale: "en-US",
    role: "unassigned",
    is_active: true,
    created_at: new Date(0),
    updated_at: new Date(1),
    teacherProfileId: null,
    parentProfileId: null,
    parentAddress: null,
  };
}

test("self-profile DTO preserves unassigned roles and dates but omits auth linkage", () => {
  const input = profile();
  const result = profileResponse(input);

  assert.deepEqual(Object.keys(result).toSorted(), [
    "created_at",
    "email",
    "id",
    "is_active",
    "locale",
    "name",
    "parentAddress",
    "parentProfileId",
    "phone",
    "photo_url",
    "role",
    "teacherProfileId",
  ]);
  assert.equal(result.role, "unassigned");
  assert.equal(result.created_at, input.created_at);
  assert.equal("authUserId" in result, false);
  assert.equal("updated_at" in result, false);
});

test("self-profile DTO retains parent address and profile IDs", () => {
  const input: UserProfileWithIds = {
    ...profile(),
    role: "parent",
    parentProfileId: "parent-id",
    parentAddress: {
      address_line1: "123 Main St",
      address_line2: null,
      city: "Los Angeles",
      state: "CA",
      postal_code: "90210",
    },
  };
  const result = profileResponse(input);

  assert.equal(result.parentProfileId, input.parentProfileId);
  assert.deepEqual(result.parentAddress, input.parentAddress);
  assert.equal(result.teacherProfileId, null);
});
