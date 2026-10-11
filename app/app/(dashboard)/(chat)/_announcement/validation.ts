import { z } from "zod";

export const announcementSchema = z
  .object({
    is_announcement: z.boolean(),
  })
  .passthrough();
