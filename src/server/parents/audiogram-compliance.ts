import { and, desc, eq } from "drizzle-orm";
import { DocumentTable } from "@/db/schema";
import { db } from "@/lib/db";
import type { AudiogramCompliance } from "@/server/parents/types";
import { addDaysStr, compareDateStr, todayStr } from "@/server/shared/dates";

const DUE_SOON_DAYS = 30;

export async function getAudiogramCompliance(studentId: string): Promise<AudiogramCompliance> {
  const audiograms = await db
    .select({
      next_due_date: DocumentTable.next_due_date,
    })
    .from(DocumentTable)
    .where(
      and(
        eq(DocumentTable.entity_type, "student"),
        eq(DocumentTable.entity_id, studentId),
        eq(DocumentTable.document_type, "audiogram"),
        eq(DocumentTable.review_status, "approved"),
      ),
    )
    .orderBy(desc(DocumentTable.next_due_date), desc(DocumentTable.created_at))
    .limit(1);

  const nextDueDate = audiograms[0]?.next_due_date ?? null;
  if (!nextDueDate) {
    return { status: "unknown", next_due_date: null };
  }

  const today = todayStr();
  const dueSoonCutoff = addDaysStr(today, DUE_SOON_DAYS);

  if (compareDateStr(nextDueDate, today) < 0) {
    return { status: "overdue", next_due_date: nextDueDate };
  }

  if (compareDateStr(nextDueDate, dueSoonCutoff) <= 0) {
    return { status: "due_soon", next_due_date: nextDueDate };
  }

  return { status: "up_to_date", next_due_date: nextDueDate };
}
