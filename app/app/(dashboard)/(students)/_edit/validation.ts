import { z } from "zod";

import { createStudentSchema } from "../_create/validation";

export const updateStudentSchema = createStudentSchema
  .partial()
  .extend({ is_active: z.boolean().optional() })
  .passthrough();
