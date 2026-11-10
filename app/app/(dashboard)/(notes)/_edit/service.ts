import { and, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type SessionNoteEntity, SessionNoteTable } from "@/_platform/db/schema";

export async function update(
  id: string,
  teacherId: string,
  note: string,
): Promise<SessionNoteEntity | null> {
  const existing = await db
    .select()
    .from(SessionNoteTable)
    .where(and(eq(SessionNoteTable.id, id), eq(SessionNoteTable.teacher_id, teacherId)))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const result = await db
    .update(SessionNoteTable)
    .set({ note, updated_at: new Date() })
    .where(eq(SessionNoteTable.id, id))
    .returning();

  return result[0] ?? null;
}
