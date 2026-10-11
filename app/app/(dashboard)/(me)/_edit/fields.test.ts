import assert from "node:assert/strict";
import test from "node:test";

import type { UpdateMeInput } from "../_domain/types";
import { addressFields, profileFields } from "./fields";
import { updateMeSchema } from "./validation";

test("self-edits cannot change identity, role, status, or auth linkage", () => {
  const parsed = updateMeSchema.parse({
    name: "Parent",
    phone: "555-0100",
    photo_url: "https://example.org/photo",
    locale: "es-ES",
    id: "other-user",
    email: "other@example.org",
    role: "administrator",
    is_active: true,
    authUserId: "other-auth-user",
    created_at: new Date(0),
  }) as UpdateMeInput;
  const { updated_at, ...fields } = profileFields(parsed);

  assert.ok(updated_at instanceof Date);
  assert.deepEqual(fields, {
    name: "Parent",
    phone: "555-0100",
    photo_url: "https://example.org/photo",
    locale: "es-ES",
  });
});

test("self-edits retain nullable contact data without writing omitted fields", () => {
  const parsed = updateMeSchema.parse({ phone: null, photo_url: null }) as UpdateMeInput;
  const { updated_at, ...fields } = profileFields(parsed);
  assert.ok(updated_at instanceof Date);
  assert.deepEqual(fields, { phone: null, photo_url: null });
  assert.deepEqual(Object.keys(profileFields({})), ["updated_at"]);
});

test("address edits clear blank fields, retain values, and ignore unrelated fields", () => {
  const parsed = updateMeSchema.parse({
    name: "Ignored for address",
    address_line1: "123 Main St",
    address_line2: "",
    city: null,
    state: "CA",
    postal_code: "90210",
    user_id: "other-user",
  }) as UpdateMeInput;
  const { updated_at, ...fields } = addressFields(parsed);

  assert.ok(updated_at instanceof Date);
  assert.deepEqual(fields, {
    address_line1: "123 Main St",
    address_line2: null,
    city: null,
    state: "CA",
    postal_code: "90210",
  });
  assert.deepEqual(Object.keys(addressFields({})), ["updated_at"]);
});

test("self-edit validation retains existing field limits", () => {
  assert.equal(updateMeSchema.safeParse({ state: "CA" }).success, true);
  assert.equal(updateMeSchema.safeParse({ state: "California" }).success, false);
  assert.equal(updateMeSchema.safeParse({ name: null }).success, false);
});
