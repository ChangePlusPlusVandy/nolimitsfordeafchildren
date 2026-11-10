import {
  assertCanAccessStudent,
  assertCanAccessTeacherRecord,
} from "@/(dashboard)/(students)/_domain/access";
import { NotFoundError } from "@/_shared/server/errors";

import type { DocumentReviewStatus, EntityType } from "./types";

export { assertCanViewDocumentFile } from "../_download/service";

type AccessUser = { id: string; role: "administrator" | "teacher" | "parent" | "unassigned" };

/**
 * Review-status filter for document lists: parents only see approved documents;
 * staff see whatever they asked for (including pending/rejected for review).
 */
export function visibleReviewStatus(
  user: Pick<AccessUser, "role">,
  requested?: DocumentReviewStatus,
): DocumentReviewStatus | undefined {
  return user.role === "parent" ? "approved" : requested;
}

/** Throws NotFoundError when a parent asks for a document that is not approved. */
export function assertReviewStatusVisible(
  user: Pick<AccessUser, "role">,
  doc: { review_status: string },
): void {
  if (user.role === "parent" && doc.review_status !== "approved") {
    throw new NotFoundError("Document not found");
  }
}

export async function assertCanAccessDocumentEntity(
  user: AccessUser,
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  if (entityType === "student") {
    await assertCanAccessStudent(user, entityId);
    return;
  }
  await assertCanAccessTeacherRecord(user, entityId);
}
