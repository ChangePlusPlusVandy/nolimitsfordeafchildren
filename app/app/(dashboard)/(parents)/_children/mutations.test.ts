import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { eq, inArray } from "drizzle-orm";
import { getPlatformProxy } from "wrangler";

import { db, setDb } from "@/_platform/db";
import {
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  SiblingTable,
  StudentTable,
  UserTable,
} from "@/_platform/db/schema";
import { ForbiddenError } from "@/_shared/server/errors";

import {
  addChildSibling,
  removeChildSibling,
  updateChildHearingInfo,
  updateChildSibling,
} from "./mutations";

const siteId = crypto.randomUUID();
const parentId = crypto.randomUUID();
const userId = crypto.randomUUID();
const ownChildId = crypto.randomUUID();
const otherChildId = crypto.randomUUID();
const otherSiblingId = crypto.randomUUID();
let proxy: Awaited<ReturnType<typeof getPlatformProxy<{ DB: D1Database }>>>;

before(async () => {
  proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: "wrangler.jsonc",
    persist: true,
  });
  setDb(proxy.env.DB);
  await db.insert(LocationTable).values({
    id: siteId,
    name: "Family test",
    type: "education_center",
    address_line1: "1 Test St",
    city: "Test",
    state: "CA",
    postal_code: "90001",
  });
  await db.insert(UserTable).values({
    id: userId,
    email: `${userId}@nolimits.test`,
    name: "Family parent",
    role: "parent",
  });
  await db.insert(ParentProfileTable).values({ id: parentId, user_id: userId });
  await db.insert(StudentTable).values(
    [ownChildId, otherChildId].map((id) => ({
      id,
      site_id: siteId,
      first_name: "Family",
      last_name: "Test",
      initials: "FT",
      dob: "2020-01-01",
    })),
  );
  await db.insert(ParentStudentLinkTable).values({ parent_id: parentId, student_id: ownChildId });
  await db.insert(SiblingTable).values({
    id: otherSiblingId,
    student_id: otherChildId,
    name: "Other family's sibling",
    relationship: "sister",
  });
});

after(async () => {
  await db.delete(SiblingTable).where(inArray(SiblingTable.student_id, [ownChildId, otherChildId]));
  await db.delete(ParentStudentLinkTable).where(eq(ParentStudentLinkTable.parent_id, parentId));
  await db.delete(StudentTable).where(eq(StudentTable.site_id, siteId));
  await db.delete(ParentProfileTable).where(eq(ParentProfileTable.id, parentId));
  await db.delete(UserTable).where(eq(UserTable.id, userId));
  await db.delete(LocationTable).where(eq(LocationTable.id, siteId));
  await proxy.dispose();
});

test("a linked child's ID cannot authorize another family's sibling update or deletion", async () => {
  await assert.rejects(
    () => updateChildSibling(userId, ownChildId, otherSiblingId, { name: "Changed" }),
    ForbiddenError,
  );
  await assert.rejects(
    () => removeChildSibling(userId, ownChildId, otherSiblingId),
    ForbiddenError,
  );
  const [sibling] = await db.select().from(SiblingTable).where(eq(SiblingTable.id, otherSiblingId));
  assert.equal(sibling?.name, "Other family's sibling");
  assert.equal(sibling?.student_id, otherChildId);
});

test("linked parents can manage their own siblings and hearing information", async () => {
  const sibling = await addChildSibling(userId, ownChildId, {
    name: "Own sibling",
    relationship: "brother",
    age: 6,
  });
  const updated = await updateChildSibling(userId, ownChildId, sibling.id, {
    name: "Updated sibling",
  });
  assert.equal(updated.name, "Updated sibling");
  await removeChildSibling(userId, ownChildId, sibling.id);
  assert.equal(
    (await db.select().from(SiblingTable).where(eq(SiblingTable.id, sibling.id))).length,
    0,
  );
  const child = await updateChildHearingInfo(userId, ownChildId, {
    hearing_devices: ["Hearing Aid"],
    hearing_loss_type: "mild",
  });
  assert.deepEqual(child.hearing_devices, ["Hearing Aid"]);
  assert.equal(child.hearing_loss_type, "mild");
});

test("an unlinked child cannot be changed through add or hearing-info mutations", async () => {
  await assert.rejects(
    () => addChildSibling(userId, otherChildId, { name: "Injected", relationship: "brother" }),
    ForbiddenError,
  );
  await assert.rejects(
    () =>
      updateChildHearingInfo(userId, otherChildId, {
        hearing_devices: [],
        hearing_loss_type: "profound",
      }),
    ForbiddenError,
  );
  const [child] = await db.select().from(StudentTable).where(eq(StudentTable.id, otherChildId));
  assert.equal(child?.hearing_loss_type, null);
});
