import type { ParentDocumentType } from "../_domain/types";
import {
  confirmChildDocumentUpload as confirmUpload,
  getChildDocumentUploadUrl as getUploadUrl,
} from "./actions";

export type { ParentDocumentType } from "../_domain/types";

export async function getChildDocumentUploadUrl(
  studentId: string,
  input: {
    document_type: ParentDocumentType | "cv";
    file_name: string;
    content_type: string;
  },
) {
  return getUploadUrl(studentId, input);
}

export async function confirmChildDocumentUpload(
  studentId: string,
  input: {
    document_type: ParentDocumentType | "cv";
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    document_date?: string;
    session_date?: string;
    session_type?: string;
  },
) {
  return confirmUpload(studentId, input);
}
