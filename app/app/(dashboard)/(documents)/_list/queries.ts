"use server";

import {
  assertCanAccessStudent,
  assertCanAccessTeacherRecord,
} from "@/(dashboard)/(students)/_domain/access";
import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError } from "@/_shared/server/errors";

import { assertCanAccessDocumentEntity, visibleReviewStatus } from "../_domain/access";
import { documentsService } from "../_domain/server";
import type { DocumentReviewStatus, ListDocumentsQuery } from "../_domain/types";

export async function listDocuments(query: ListDocumentsQuery = {}) {
  const user = await requireRole();
  if (user.role !== "administrator") {
    if (!query.entity_type || !query.entity_id) {
      throw new BadRequestError("entity_type and entity_id are required");
    }
    await assertCanAccessDocumentEntity(user, query.entity_type, query.entity_id);
  }
  return await documentsService.index({
    ...query,
    review_status: visibleReviewStatus(user, query.review_status),
  });
}

export async function listDocumentsForEntity(
  entityType: "student" | "teacher",
  entityId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole();
  await assertCanAccessDocumentEntity(user, entityType, entityId);
  return await documentsService.listForEntityPaginated(entityType, entityId, {
    ...query,
    review_status: visibleReviewStatus(user),
  });
}

export async function listStudentDocuments(
  studentId: string,
  query: { page?: number; limit?: number; review_status?: DocumentReviewStatus } = {},
) {
  const user = await requireRole();
  await assertCanAccessStudent(user, studentId);

  return await documentsService.index({
    entity_type: "student",
    entity_id: studentId,
    page: query.page,
    limit: query.limit,
    review_status: visibleReviewStatus(user, query.review_status),
  });
}

export async function listTeacherDocuments(
  teacherId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole();
  await assertCanAccessTeacherRecord(user, teacherId);
  return await documentsService.listForEntityPaginated("teacher", teacherId, query);
}
