"use server";
import {
  type DocumentReviewStatus,
  type DocumentType,
  documentsService,
  type EntityType,
  type ListDocumentsQuery,
} from "@/server/documents/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

/**
 * GET /v1/documents — list documents (any authenticated user).
 */
export async function listDocuments(query: ListDocumentsQuery = {}) {
  await requireRole();
  return await documentsService.index(query);
}

/**
 * GET /v1/documents/:id — single document (any authenticated user).
 */
export async function getDocument(id: string) {
  await requireRole();
  const result = await documentsService.show(id);
  if (!result) {
    throw new NotFoundError("Document not found");
  }
  return result;
}

/**
 * GET /v1/documents/:id/download — auth-checked download URL (route-based;
 * R2 has no presigning — see /api/files/[...key]).
 */
export async function getDocumentDownload(id: string) {
  await requireRole();
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
  await requireRole();
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
  await requireRole();
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
