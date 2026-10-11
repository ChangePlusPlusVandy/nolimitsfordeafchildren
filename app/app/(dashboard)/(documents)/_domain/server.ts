import type { DocumentEntity } from "@/_platform/db/schema";

import { getOverdueAudiograms, getAudiogramsDueSoon } from "../_audiograms/service";
import { deleteDocument } from "../_delete/service";
import { showDocument } from "../_detail/service";
import { getDownloadUrl } from "../_download/service";
import { addMetadata } from "../_list/metadata";
import { listForEntity, listForEntityPaginated, listDocuments } from "../_list/service";
import { reviewDocument } from "../_review/service";
import { validateEntity } from "../_upload/entity";
import { getUploadUrl, confirmUpload } from "../_upload/service";
import type {
  ConfirmUploadInput,
  DocumentWithMetadata,
  EntityType,
  GetUploadUrlInput,
  ListDocumentsQuery,
  ReviewDocumentInput,
} from "./types";

export type * from "./types";

export class DocumentsService {
  async getUploadUrl(input: GetUploadUrlInput) {
    return getUploadUrl(input, (type, id) => this.validateEntity(type, id));
  }

  async confirmUpload(input: ConfirmUploadInput) {
    return confirmUpload(input, (type, id) => this.validateEntity(type, id));
  }

  async listForEntity(entityType: EntityType, entityId: string) {
    return listForEntity(entityType, entityId, (doc) => this.addMetadata(doc));
  }

  async listForEntityPaginated(
    entityType: EntityType,
    entityId: string,
    query: { page?: number; limit?: number },
  ) {
    return listForEntityPaginated(entityType, entityId, query, (doc) => this.addMetadata(doc));
  }

  async index(query: ListDocumentsQuery) {
    return listDocuments(query, (doc) => this.addMetadata(doc));
  }

  async show(id: string) {
    return showDocument(id, (doc) => this.addMetadata(doc));
  }

  async getDownloadUrl(id: string) {
    return getDownloadUrl(id, (documentId) => this.show(documentId));
  }

  async delete(id: string): Promise<boolean> {
    return deleteDocument(id, (documentId) => this.show(documentId));
  }

  async reviewDocument(id: string, input: ReviewDocumentInput) {
    return reviewDocument(id, input);
  }

  async getOverdueAudiograms(daysAhead: number = 0, query: { page?: number; limit?: number } = {}) {
    return getOverdueAudiograms(daysAhead, query, (doc) => this.addMetadata(doc));
  }

  async getAudiogramsDueSoon(
    daysAhead: number = 30,
    query: { page?: number; limit?: number } = {},
  ) {
    return getAudiogramsDueSoon(daysAhead, query, (doc) => this.addMetadata(doc));
  }

  private addMetadata(doc: DocumentEntity): DocumentWithMetadata {
    return addMetadata(doc);
  }

  private async validateEntity(entityType: EntityType, entityId: string): Promise<void> {
    return validateEntity(entityType, entityId);
  }
}

export const documentsService = new DocumentsService();
