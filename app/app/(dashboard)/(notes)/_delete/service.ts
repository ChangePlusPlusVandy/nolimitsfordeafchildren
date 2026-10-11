import { and, eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { SessionNoteTable } from "@/_platform/db/schema";

export async function deleteNote(id: string, teacherId?: string): Promise<boolean> {
  const conditions = [eq(SessionNoteTable.id, id)];

  if (teacherId) {
    conditions.push(eq(SessionNoteTable.teacher_id, teacherId));
  }

  const result = await db
    .delete(SessionNoteTable)
    .where(and(...conditions))
    .returning();

  return result.length > 0;
}
