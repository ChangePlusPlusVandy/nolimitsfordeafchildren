import type { DocumentEntity } from "@/_platform/db/schema";

export type DocumentType =
  | "audiogram"
  | "iep"
  | "cv"
  | "annual_test_result"
  | "pre_report"
  | "graduation_speech"
  | "other";
export type EntityType = "student" | "teacher";
export type DocumentReviewStatus = "approved" | "pending" | "rejected";

export interface GetUploadUrlInput {
  entity_type: EntityType;
  entity_id: string;
  document_type: DocumentType;
  file_name: string;
  content_type: string;
}

export interface ConfirmUploadInput {
  entity_type: EntityType;
  entity_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  document_date?: string;
  session_date?: string;
  session_type?: string;
  uploaded_by: string;
}

export interface ListDocumentsQuery {
  entity_type?: EntityType;
  entity_id?: string;
  document_type?: DocumentType;
  page?: number;
  limit?: number;
  review_status?: DocumentReviewStatus;
}

export interface PaginatedDocumentsResult {
  items: DocumentWithMetadata[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DocumentWithMetadata = DocumentEntity & {
  is_overdue: boolean;
  days_until_due: number | null;
};

export interface ReviewDocumentInput {
  status: Exclude<DocumentReviewStatus, "pending">;
  review_notes?: string;
  reviewed_by: string;
}

export interface Document {
  id: string;
  entity_type: "student" | "teacher";
  entity_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  document_date: string | null;
  next_due_date: string | null;
  review_status: DocumentReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  session_date: string | null;
  session_type: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
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
  document_type?: DocumentType;
  review_status?: DocumentReviewStatus;
  page?: number;
  limit?: number;
}
