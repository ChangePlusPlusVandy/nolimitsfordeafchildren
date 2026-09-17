"use server";
import {
  type DocumentReviewStatus,
  type DocumentType,
  documentsService,
  type EntityType,
  type ListDocumentsQuery,
} from "@/server/documents/service";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";
import {
  assertCanAccessStudent,
  assertCanAccessTeacherRecord,
} from "@/server/shared/student-access";

async function assertCanAccessDocumentEntity(
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

/**
 * GET /v1/documents — list documents (any authenticated user).
 */
export async function listDocuments(query: ListDocumentsQuery = {}) {
  const user = await requireRole();
  if (user.role !== "administrator") {
    if (!query.entity_type || !query.entity_id) {
      throw new BadRequestError("entity_type and entity_id are required");
    }
    await assertCanAccessDocumentEntity(user, query.entity_type, query.entity_id);
  }
  return await documentsService.index(query);
}

/**
 * GET /v1/documents/:id — single document (any authenticated user).
 */
export async function getDocument(id: string) {
  const user = await requireRole();
  const result = await documentsService.show(id);
  if (!result) {
    throw new NotFoundError("Document not found");
  }
  await assertCanAccessDocumentEntity(user, result.entity_type as EntityType, result.entity_id);
  return result;
}

/**
 * GET /v1/documents/:id/download — auth-checked download URL (route-based;
 * R2 has no presigning — see /api/files/[...key]).
 */
export async function getDocumentDownload(id: string) {
  const user = await requireRole();
  const doc = await documentsService.show(id);
  if (!doc) {
    throw new NotFoundError("Document not found");
  }
  await assertCanAccessDocumentEntity(user, doc.entity_type as EntityType, doc.entity_id);
  const result = await documentsService.getDownloadUrl(id);
  if (!result) {
    throw new NotFoundError("Document not found");
  }
  return result;
}

/**
 * Client-facing alias (src/client/documents.ts imports this name).
 */
export async function getDocumentDownloadUrl(id: string) {
  return await getDocumentDownload(id);
}

/**
 * Client-facing helper — documents for an entity (student | teacher) with
 * pagination (src/client/documents.ts imports this name).
 */
export async function listDocumentsForEntity(
  entityType: "student" | "teacher",
  entityId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole();
  await assertCanAccessDocumentEntity(user, entityType, entityId);
  return await documentsService.listForEntityPaginated(entityType, entityId, query);
}

/**
 * GET /v1/students/:id/documents — parents only see approved documents.
 */
export async function listStudentDocuments(
  studentId: string,
  query: { page?: number; limit?: number; review_status?: DocumentReviewStatus } = {},
) {
  const user = await requireRole();
  await assertCanAccessStudent(user, studentId);
  const effectiveReviewStatus = user.role === "parent" ? "approved" : query.review_status;

  return await documentsService.index({
    entity_type: "student",
    entity_id: studentId,
    page: query.page,
    limit: query.limit,
    review_status: effectiveReviewStatus,
  });
}

/**
 * GET /v1/teachers/:id/documents — teacher CV/certifications.
 */
export async function listTeacherDocuments(
  teacherId: string,
  query: { page?: number; limit?: number } = {},
) {
  const user = await requireRole();
  await assertCanAccessTeacherRecord(user, teacherId);
  return await documentsService.listForEntityPaginated("teacher", teacherId, query);
}

/**
 * GET /v1/documents/audiograms/overdue — admin only.
 */
export async function overdueAudiograms(query: { page?: number; limit?: number } = {}) {
  await requireRole("administrator");
  return await documentsService.getOverdueAudiograms(0, query);
}

/**
 * GET /v1/documents/audiograms/due-soon — admin only (default 30 days).
 */
export async function audiogramsDueSoon(
  query: { days?: number; page?: number; limit?: number } = {},
) {
  await requireRole("administrator");
  const days = query.days || 30;
  return await documentsService.getAudiogramsDueSoon(days, {
    page: query.page,
    limit: query.limit,
  });
}

export type { DocumentType, EntityType };
