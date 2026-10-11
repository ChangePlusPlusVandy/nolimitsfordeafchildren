import { z } from "zod";

const entityTypeSchema = z.enum(["student", "teacher"]);
const documentTypeSchema = z.enum([
  "audiogram",
  "iep",
  "cv",
  "annual_test_result",
  "pre_report",
  "graduation_speech",
  "other",
]);

export const uploadUrlSchema = z
  .object({
    entity_type: entityTypeSchema,
    entity_id: z.string().min(1),
    document_type: documentTypeSchema,
    file_name: z.string().min(1).max(255),
    content_type: z.string().min(1).max(200),
  })
  .passthrough();

export const confirmUploadSchema = uploadUrlSchema
  .omit({ content_type: true })
  .merge(
    z.object({
      file_url: z.string().min(1).max(500),
      file_size: z.number().int().nonnegative().optional(),
      mime_type: z.string().max(200).optional(),
      document_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
      session_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
      session_type: z.string().max(100).nullable().optional(),
    }),
  )
  .passthrough();
