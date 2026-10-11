import { z } from "zod";

export const addAttachmentSchema = z
  .object({
    file_url: z.string().min(1).max(500),
    file_name: z.string().min(1).max(255),
    file_size: z.number().int().nonnegative().optional(),
    mime_type: z.string().max(200).optional(),
  })
  .passthrough();

export const attachmentUploadUrlSchema = z
  .object({
    file_name: z.string().min(1).max(255),
    content_type: z.string().min(1).max(200),
  })
  .passthrough();
