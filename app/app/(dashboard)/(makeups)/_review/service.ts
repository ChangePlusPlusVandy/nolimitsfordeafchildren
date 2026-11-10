import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { MakeupRequestTable, type MakeupRequestEntity } from "@/_platform/db/schema";
import { ConflictError } from "@/_shared/server/errors";

export async function reviewRequest(
  requestId: string,
  adminId: string,
  status: "approved" | "denied",
  reviewNotes?: string,
): Promise<MakeupRequestEntity | null> {
  const existing = await db
    .select()
    .from(MakeupRequestTable)
    .where(eq(MakeupRequestTable.id, requestId))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  if (existing[0]!.status !== "pending") {
    throw new ConflictError("Request has already been reviewed");
  }

  const result = await db
    .update(MakeupRequestTable)
    .set({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date(),
      review_notes: reviewNotes || null,
      updated_at: new Date(),
    })
    .where(eq(MakeupRequestTable.id, requestId))
    .returning();

  return result[0] ?? null;
}
