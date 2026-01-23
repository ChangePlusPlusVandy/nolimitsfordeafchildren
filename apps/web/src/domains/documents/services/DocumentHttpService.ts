import { useHttpClient } from "../../../plugins/axios";

export type DocumentType = "audiogram" | "iep" | "cv" | "annual_test_result" | "other";

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

export function useDocumentHttpService() {
  const httpClient = useHttpClient();

  return {
    key: "documents",

    queries: {
      /**
       * List all documents for a student
       */
      listForStudent: async (studentId: string): Promise<Document[]> => {
        const response = await httpClient.get(`/v1/students/${studentId}/documents`);
        return response.data;
      },

      /**
       * List all documents for a teacher
       */
      listForTeacher: async (teacherId: string): Promise<Document[]> => {
        const response = await httpClient.get(`/v1/teachers/${teacherId}/documents`);
        return response.data;
      },

      /**
       * Get a presigned download URL for a document
       */
      getDownloadUrl: async (documentId: string): Promise<DownloadUrlResponse> => {
        const response = await httpClient.get(`/v1/documents/${documentId}/download`);
        return response.data;
      },
    },

    mutations: {
      /**
       * Delete a document (admin only)
       */
      delete: async (documentId: string): Promise<{ success: boolean }> => {
        const response = await httpClient.delete(`/v1/documents/${documentId}`);
        return response.data;
      },
    },
  };
}
