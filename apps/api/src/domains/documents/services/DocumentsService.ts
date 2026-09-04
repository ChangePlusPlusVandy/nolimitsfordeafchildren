import { Service } from "typedi";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  DocumentTable,
  StudentTable,
  TeacherProfileTable,
  type DocumentEntity,
  type DocumentInsert,
} from "@/db/schema";
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteFile,
  extractKeyFromUrl,
  getPublicUrl,
} from "@/s3";
import { randomUUID } from "crypto";
import { buildPaginatedResponse, getPagination, type PaginatedResponse } from "@/utils/pagination";

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

@Service()
export class DocumentsService {
  /**
   * Generate a presigned URL for uploading a document
   */
  async getUploadUrl(input: GetUploadUrlInput): Promise<{
    upload_url: string;
    file_key: string;
    file_url: string;
  }> {
    // Validate entity exists
    await this.validateEntity(input.entity_type, input.entity_id);

    // Generate unique file key
    const fileExtension = input.file_name.split(".").pop() || "";
    const uniqueId = randomUUID();
    const fileKey = `documents/${input.entity_type}/${input.entity_id}/${input.document_type}/${uniqueId}.${fileExtension}`;

    // Get presigned upload URL
    const uploadUrl = await getPresignedUploadUrl(fileKey, input.content_type);
    const fileUrl = getPublicUrl(fileKey);

    return {
      upload_url: uploadUrl,
      file_key: fileKey,
      file_url: fileUrl,
    };
  }

  /**
   * Confirm upload and create document record
   */
  async confirmUpload(input: ConfirmUploadInput): Promise<DocumentEntity> {
    // Validate entity exists
    await this.validateEntity(input.entity_type, input.entity_id);

    // Calculate next_due_date for audiograms (6 months from document_date)
    let nextDueDate: string | null = null;
    if (input.document_type === "audiogram" && input.document_date) {
      const docDate = new Date(input.document_date);
      docDate.setMonth(docDate.getMonth() + 6);
      nextDueDate = docDate.toISOString().split("T")[0]!;
    }

    const newDocument: DocumentInsert = {
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      document_type: input.document_type,
      file_url: input.file_url,
      file_name: input.file_name,
      file_size: input.file_size || null,
      mime_type: input.mime_type || null,
      document_date: input.document_date || null,
      next_due_date: nextDueDate,
      review_status:
        input.document_type === "pre_report" || input.document_type === "graduation_speech"
          ? "pending"
          : "approved",
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      session_date: input.session_date || null,
      session_type: input.session_type || null,
      uploaded_by: input.uploaded_by,
    };

    const result = await db.insert(DocumentTable).values(newDocument).returning();

    return result[0]!;
  }

  /**
   * List documents for an entity
   */
  async listForEntity(entityType: EntityType, entityId: string): Promise<DocumentWithMetadata[]> {
    const results = await db
      .select()
      .from(DocumentTable)
      .where(and(eq(DocumentTable.entity_type, entityType), eq(DocumentTable.entity_id, entityId)))
      .orderBy(desc(DocumentTable.created_at));

    return results.map((doc) => this.addMetadata(doc));
  }

  /**
   * List paginated documents for an entity
   */
  async listForEntityPaginated(
    entityType: EntityType,
    entityId: string,
    query: { page?: number; limit?: number },
  ): Promise<PaginatedDocumentsResult> {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 10, 1), 100);
    const offset = (page - 1) * limit;

    const whereClause = and(
      eq(DocumentTable.entity_type, entityType),
      eq(DocumentTable.entity_id, entityId),
    );

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(DocumentTable)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    const results = await db
      .select()
      .from(DocumentTable)
      .where(whereClause)
      .orderBy(desc(DocumentTable.created_at))
      .limit(limit)
      .offset(offset);

    return {
      items: results.map((doc) => this.addMetadata(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List all documents with filtering
   */
  async index(query: ListDocumentsQuery): Promise<{
    items: DocumentWithMetadata[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.entity_type) {
      conditions.push(eq(DocumentTable.entity_type, query.entity_type));
    }

    if (query.entity_id) {
      conditions.push(eq(DocumentTable.entity_id, query.entity_id));
    }

    if (query.document_type) {
      conditions.push(eq(DocumentTable.document_type, query.document_type));
    }

    if (query.review_status) {
      conditions.push(eq(DocumentTable.review_status, query.review_status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(DocumentTable)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get paginated results
    const results = await db
      .select()
      .from(DocumentTable)
      .where(whereClause)
      .orderBy(desc(DocumentTable.created_at))
      .limit(limit)
      .offset(offset);

    const items = results.map((doc) => this.addMetadata(doc));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single document by ID
   */
  async show(id: string): Promise<DocumentWithMetadata | null> {
    const result = await db.select().from(DocumentTable).where(eq(DocumentTable.id, id)).limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.addMetadata(result[0]!);
  }

  /**
   * Get presigned download URL for a document
   */
  async getDownloadUrl(id: string): Promise<{ download_url: string } | null> {
    const document = await this.show(id);
    if (!document) {
      return null;
    }

    const fileKey = extractKeyFromUrl(document.file_url);
    if (!fileKey) {
      // File URL is not from our S3, return as-is
      return { download_url: document.file_url };
    }

    const downloadUrl = await getPresignedDownloadUrl(fileKey);
    return { download_url: downloadUrl };
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<boolean> {
    const document = await this.show(id);
    if (!document) {
      return false;
    }

    // Delete from S3
    const fileKey = extractKeyFromUrl(document.file_url);
    if (fileKey) {
      try {
        await deleteFile(fileKey);
      } catch (error) {
        console.error("Failed to delete file from S3:", error);
        // Continue with database deletion even if S3 delete fails
      }
    }

    // Delete from database
    await db.delete(DocumentTable).where(eq(DocumentTable.id, id));

    return true;
  }

  async reviewDocument(id: string, input: ReviewDocumentInput): Promise<DocumentEntity | null> {
    const existing = await db.select().from(DocumentTable).where(eq(DocumentTable.id, id)).limit(1);
    if (existing.length === 0) {
      return null;
    }

    const current = existing[0]!;
    if (current.review_status !== "pending") {
      throw new Error("Document has already been reviewed");
    }

    const result = await db
      .update(DocumentTable)
      .set({
        review_status: input.status,
        reviewed_by: input.reviewed_by,
        reviewed_at: new Date(),
        review_notes: input.review_notes || null,
        updated_at: new Date(),
      })
      .where(eq(DocumentTable.id, id))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Get overdue audiograms (for admin alerts and cron jobs)
   */
  async getOverdueAudiograms(
    daysAhead: number = 0,
    query: { page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<DocumentWithMetadata>> {
    const { page, limit, offset } = getPagination(query, 20, 100);
    const today = new Date();
    today.setDate(today.getDate() + daysAhead);
    const checkDate = today.toISOString().split("T")[0]!;

    const whereClause = and(
      eq(DocumentTable.document_type, "audiogram"),
      lte(DocumentTable.next_due_date, checkDate),
    );

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(DocumentTable)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    const results = await db
      .select()
      .from(DocumentTable)
      .where(whereClause)
      .orderBy(DocumentTable.next_due_date)
      .limit(limit)
      .offset(offset);

    const items = results.map((doc) => this.addMetadata(doc));

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Get audiograms due within N days (for reminder emails)
   */
  async getAudiogramsDueSoon(
    daysAhead: number = 30,
    query: { page?: number; limit?: number } = {},
  ): Promise<
    PaginatedResponse<
      DocumentWithMetadata & {
        student?: { id: string; first_name: string; last_name: string; initials: string };
      }
    >
  > {
    const { page, limit, offset } = getPagination(query, 20, 100);
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const todayStr = today.toISOString().split("T")[0]!;
    const futureDateStr = futureDate.toISOString().split("T")[0]!;

    const whereClause = and(
      eq(DocumentTable.document_type, "audiogram"),
      eq(DocumentTable.entity_type, "student"),
      gte(DocumentTable.next_due_date, todayStr),
      lte(DocumentTable.next_due_date, futureDateStr),
    );

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(DocumentTable)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    const results = await db
      .select({
        id: DocumentTable.id,
        entity_type: DocumentTable.entity_type,
        entity_id: DocumentTable.entity_id,
        document_type: DocumentTable.document_type,
        file_url: DocumentTable.file_url,
        file_name: DocumentTable.file_name,
        file_size: DocumentTable.file_size,
        mime_type: DocumentTable.mime_type,
        document_date: DocumentTable.document_date,
        next_due_date: DocumentTable.next_due_date,
        review_status: DocumentTable.review_status,
        reviewed_by: DocumentTable.reviewed_by,
        reviewed_at: DocumentTable.reviewed_at,
        review_notes: DocumentTable.review_notes,
        session_date: DocumentTable.session_date,
        session_type: DocumentTable.session_type,
        uploaded_by: DocumentTable.uploaded_by,
        created_at: DocumentTable.created_at,
        updated_at: DocumentTable.updated_at,
        student_id: StudentTable.id,
        student_first_name: StudentTable.first_name,
        student_last_name: StudentTable.last_name,
        student_initials: StudentTable.initials,
      })
      .from(DocumentTable)
      .leftJoin(StudentTable, eq(DocumentTable.entity_id, StudentTable.id))
      .where(whereClause)
      .orderBy(DocumentTable.next_due_date)
      .limit(limit)
      .offset(offset);

    const items = results.map((row) => ({
      ...this.addMetadata({
        id: row.id,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        document_type: row.document_type,
        file_url: row.file_url,
        file_name: row.file_name,
        file_size: row.file_size,
        mime_type: row.mime_type,
        document_date: row.document_date,
        next_due_date: row.next_due_date,
        review_status: row.review_status,
        reviewed_by: row.reviewed_by,
        reviewed_at: row.reviewed_at,
        review_notes: row.review_notes,
        session_date: row.session_date,
        session_type: row.session_type,
        uploaded_by: row.uploaded_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
      student: row.student_id
        ? {
            id: row.student_id,
            first_name: row.student_first_name!,
            last_name: row.student_last_name!,
            initials: row.student_initials!,
          }
        : undefined,
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  /**
   * Add metadata (overdue status, days until due) to a document
   */
  private addMetadata(doc: DocumentEntity): DocumentWithMetadata {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isOverdue = false;
    let daysUntilDue: number | null = null;

    if (doc.next_due_date) {
      const dueDate = new Date(doc.next_due_date);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isOverdue = daysUntilDue < 0;
    }

    return {
      ...doc,
      is_overdue: isOverdue,
      days_until_due: daysUntilDue,
    };
  }

  /**
   * Validate that an entity exists
   */
  private async validateEntity(entityType: EntityType, entityId: string): Promise<void> {
    if (entityType === "student") {
      const student = await db
        .select()
        .from(StudentTable)
        .where(eq(StudentTable.id, entityId))
        .limit(1);

      if (student.length === 0) {
        throw new Error("Student not found");
      }
    } else if (entityType === "teacher") {
      const teacher = await db
        .select()
        .from(TeacherProfileTable)
        .where(eq(TeacherProfileTable.id, entityId))
        .limit(1);

      if (teacher.length === 0) {
        throw new Error("Teacher not found");
      }
    } else {
      throw new Error("Invalid entity type");
    }
  }
}
