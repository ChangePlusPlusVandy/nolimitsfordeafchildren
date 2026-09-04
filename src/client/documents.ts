/**
 * Thin client data-access layer for Documents (upload, list, review, download).
 *
 * Names reconcile 1:1 with `src/server/documents/{queries,actions}.ts`.
 */

import {
  confirmDocumentUpload as serverConfirmDocumentUpload,
  deleteDocument as serverDeleteDocument,
  getDocumentUploadUrl as serverGetDocumentUploadUrl,
  reviewDocument as serverReviewDocument,
} from "@/server/documents/actions";
import {
  getDocumentDownload as serverGetDocumentDownload,
  listDocuments as serverListDocuments,
  listStudentDocuments as serverListStudentDocuments,
  listTeacherDocuments as serverListTeacherDocuments,
} from "@/server/documents/queries";

export type {
  DocumentReviewStatus,
  DocumentType,
  EntityType,
  GetUploadUrlInput,
  ListDocumentsQuery,
  ReviewDocumentInput,
} from "@/server/documents/service";

export interface Document {
  id: string;
  entity_type: "student" | "teacher";
  entity_id: string;
  document_type: import("@/server/documents/service").DocumentType;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  document_date: string | null;
  next_due_date: string | null;
  review_status: import("@/server/documents/service").DocumentReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  session_date: string | null;
  session_type: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  // Computed fields from backend
  is_overdue?: boolean;
  days_until_due?: number;
}

export interface DownloadUrlResponse {
  download_url: string;
  file_name: string;
  content_type: string;
}

export interface PaginatedDocumentsResponse {
  items: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListDocumentsParams {
  entity_type?: "student" | "teacher";
  entity_id?: string;
  document_type?: import("@/server/documents/service").DocumentType;
  review_status?: import("@/server/documents/service").DocumentReviewStatus;
  page?: number;
  limit?: number;
}

export async function listDocuments(
  params?: ListDocumentsParams,
): Promise<PaginatedDocumentsResponse> {
  return serverListDocuments(params as never) as never;
}

export async function listDocumentsForStudent(
  studentId: string,
  page = 1,
  limit = 10,
  reviewStatus?: import("@/server/documents/service").DocumentReviewStatus,
): Promise<PaginatedDocumentsResponse> {
  return serverListStudentDocuments(studentId, {
    page,
    limit,
    review_status: reviewStatus,
  }) as never;
}

export async function listDocumentsForTeacher(
  teacherId: string,
  page = 1,
  limit = 10,
): Promise<PaginatedDocumentsResponse> {
  return serverListTeacherDocuments(teacherId, { page, limit }) as never;
}

export async function getDownloadUrl(documentId: string): Promise<DownloadUrlResponse> {
  return serverGetDocumentDownload(documentId) as never;
}

/** Step 1 of upload: get a presigned upload URL. */
export async function getUploadUrl(input: {
  entity_type: string;
  entity_id: string;
  document_type: string;
  file_name: string;
  content_type: string;
}): Promise<{ upload_url: string; file_key: string; file_url: string }> {
  return serverGetDocumentUploadUrl(input as never) as never;
}

/** Step 3 of upload: confirm the file was stored and create the record. */
export async function confirmUpload(input: {
  entity_type: string;
  entity_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  document_date?: string;
  session_date?: string;
  session_type?: string;
}) {
  return serverConfirmDocumentUpload(input as never);
}

export async function deleteDocument(documentId: string): Promise<{ success: boolean }> {
  return serverDeleteDocument(documentId);
}

export async function reviewDocument({
  id,
  status,
  review_notes,
}: {
  id: string;
  status: "approved" | "rejected";
  review_notes?: string;
}) {
  return serverReviewDocument(id, { status, review_notes });
}
