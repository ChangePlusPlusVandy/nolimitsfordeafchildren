import { deleteDocument as serverDeleteDocument } from "../_delete/actions";
import { reviewDocument as serverReviewDocument } from "../_review/actions";
import {
  confirmDocumentUpload as serverConfirmDocumentUpload,
  getDocumentUploadUrl as serverGetDocumentUploadUrl,
} from "../_upload/actions";
import {
  getDocumentDownload as serverGetDocumentDownload,
  listDocuments as serverListDocuments,
  listStudentDocuments as serverListStudentDocuments,
  listTeacherDocuments as serverListTeacherDocuments,
} from "./queries";
import type { DownloadUrlResponse, ListDocumentsParams, PaginatedDocumentsResponse } from "./types";

export type * from "./types";

export async function listDocuments(
  params?: ListDocumentsParams,
): Promise<PaginatedDocumentsResponse> {
  return serverListDocuments(params as never) as never;
}

export async function listDocumentsForStudent(
  studentId: string,
  page = 1,
  limit = 10,
  reviewStatus?: import("./types").DocumentReviewStatus,
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

export async function getUploadUrl(input: {
  entity_type: string;
  entity_id: string;
  document_type: string;
  file_name: string;
  content_type: string;
}): Promise<{ upload_url: string; file_key: string; file_url: string }> {
  return serverGetDocumentUploadUrl(input as never) as never;
}

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
