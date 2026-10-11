import {
  assertCanAccessStudent,
  assertCanAccessTeacherRecord,
} from "@/(dashboard)/(students)/_domain/access";

import type { EntityType } from "./types";

export async function assertCanAccessDocumentEntity(
  user: { id: string; role: "administrator" | "teacher" | "parent" | "unassigned" },
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  if (entityType === "student") {
    await assertCanAccessStudent(user, entityId);
    return;
  }
  await assertCanAccessTeacherRecord(user, entityId);
}
