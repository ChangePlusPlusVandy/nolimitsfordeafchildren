import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type SiblingEntity, SiblingTable } from "@/_platform/db/schema";

import type { AddSiblingInput, UpdateSiblingInput } from "../_domain/types";

export async function addSibling(studentId: string, data: AddSiblingInput): Promise<SiblingEntity> {
  const [sibling] = await db
    .insert(SiblingTable)
    .values({
      student_id: studentId,
      name: data.name,
      age: data.age,
      relationship: data.relationship,
      is_participant: data.is_participant ?? true,
      has_hearing_loss: data.has_hearing_loss ?? false,
      photo_url: data.photo_url,
      notes: data.notes,
    })
    .returning();

  if (!sibling) {
    throw new Error("Failed to create sibling");
  }

  return sibling;
}

export async function updateSibling(
  siblingId: string,
  data: UpdateSiblingInput,
): Promise<SiblingEntity | null> {
  const [sibling] = await db
    .update(SiblingTable)
    .set({ ...data, updated_at: new Date() })
    .where(eq(SiblingTable.id, siblingId))
    .returning();

  return sibling || null;
}

export async function removeSibling(siblingId: string): Promise<{ ok: boolean }> {
  await db.delete(SiblingTable).where(eq(SiblingTable.id, siblingId));
  return { ok: true };
}
