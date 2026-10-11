import { z } from "zod";

export const createStudentSchema = z
  .object({
    site_id: z.string().min(1),
    first_name: z.string().max(100),
    last_name: z.string().max(100),
    initials: z.string().max(8).optional(),
    photo_url: z.string().max(500).nullable().optional(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    current_school: z.string().max(200).nullable().optional(),
    preferred_language: z.string().max(100).nullable().optional(),
    hearing_devices: z.array(z.string()).optional(),
    hearing_loss_type: z
      .enum(["mild", "moderate", "moderately_severe", "severe", "profound", "unknown"])
      .nullable()
      .optional(),
    guardian_summary: z.string().nullable().optional(),
  })
  .passthrough();
