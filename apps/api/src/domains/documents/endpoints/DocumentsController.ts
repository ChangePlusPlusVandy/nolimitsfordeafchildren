import { Body, Get, JsonController, Param, Post, Delete, QueryParam, CurrentUser, Authorized, HttpCode } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { 
  DocumentsService, 
  type GetUploadUrlInput, 
  type ConfirmUploadInput,
  type ListDocumentsQuery,
  type EntityType,
  type DocumentType,
} from "../services/DocumentsService";
import type { UserEntity } from "@/db/schema";

@Service()
@JsonController("/v1")
export class PostDocumentsUploadUrlController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * Get a presigned URL for uploading a document
   * POST /v1/documents/upload-url
   */
  @Post("/documents/upload-url")
  @Authorized()
  async handle(@Body() body: GetUploadUrlInput) {
    return await this.documentsService.getUploadUrl(body);
  }
}

@Service()
@JsonController("/v1")
export class PostDocumentsController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * Confirm upload and create document record
   * POST /v1/documents
   */
  @Post("/documents")
  @Authorized()
  @HttpCode(201)
  async handle(
    @Body() body: Omit<ConfirmUploadInput, "uploaded_by">,
    @CurrentUser({ required: true }) currentUser: UserEntity
  ) {
    return await this.documentsService.confirmUpload({
      ...body,
      uploaded_by: currentUser.id,
    });
  }
}

@Service()
@JsonController("/v1")
export class GetDocumentsController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * List all documents with filters
   * GET /v1/documents
   */
  @Get("/documents")
  @Authorized()
  async handle(
    @QueryParam("entity_type") entity_type?: EntityType,
    @QueryParam("entity_id") entity_id?: string,
    @QueryParam("document_type") document_type?: DocumentType,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number
  ) {
    const query: ListDocumentsQuery = { entity_type, entity_id, document_type, page, limit };
    return await this.documentsService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class GetDocumentController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * Get a single document
   * GET /v1/documents/:id
   */
  @Get("/documents/:id")
  @Authorized()
  async handle(@Param("id") id: string) {
    const result = await this.documentsService.show(id);
    if (!result) {
      throw new Error("Document not found");
    }
    return result;
  }
}

@Service()
@JsonController("/v1")
export class GetDocumentDownloadController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * Get presigned download URL for a document
   * GET /v1/documents/:id/download
   */
  @Get("/documents/:id/download")
  @Authorized()
  async handle(@Param("id") id: string) {
    const result = await this.documentsService.getDownloadUrl(id);
    if (!result) {
      throw new Error("Document not found");
    }
    return result;
  }
}

@Service()
@JsonController("/v1")
export class DeleteDocumentController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * Delete a document
   * DELETE /v1/documents/:id
   */
  @Delete("/documents/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    const deleted = await this.documentsService.delete(id);
    if (!deleted) {
      throw new Error("Document not found");
    }
    return { success: true };
  }
}

@Service()
@JsonController("/v1")
export class GetStudentDocumentsController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * List documents for a student
   * GET /v1/students/:id/documents
   */
  @Get("/students/:id/documents")
  @Authorized()
  async handle(@Param("id") studentId: string) {
    return await this.documentsService.listForEntity("student", studentId);
  }
}

@Service()
@JsonController("/v1")
export class GetTeacherDocumentsController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * List documents for a teacher (CV, certifications)
   * GET /v1/teachers/:id/documents
   */
  @Get("/teachers/:id/documents")
  @Authorized()
  async handle(@Param("id") teacherId: string) {
    return await this.documentsService.listForEntity("teacher", teacherId);
  }
}

@Service()
@JsonController("/v1")
export class GetOverdueAudiogramsController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * Get overdue audiograms (admin dashboard)
   * GET /v1/documents/audiograms/overdue
   */
  @Get("/documents/audiograms/overdue")
  @Authorized(["administrator"])
  async handle() {
    return await this.documentsService.getOverdueAudiograms();
  }
}

@Service()
@JsonController("/v1")
export class GetAudiogramsDueSoonController {
  private documentsService: DocumentsService;
  constructor() {
    this.documentsService = Container.get(DocumentsService);
  }

  /**
   * Get audiograms due within N days
   * GET /v1/documents/audiograms/due-soon
   */
  @Get("/documents/audiograms/due-soon")
  @Authorized(["administrator"])
  async handle(@QueryParam("days") days?: number) {
    const daysValue = days || 30;
    return await this.documentsService.getAudiogramsDueSoon(daysValue);
  }
}
