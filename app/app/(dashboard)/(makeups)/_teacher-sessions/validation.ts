import { z } from "zod";

export const markAttendanceSchema = z
  .object({ status: z.enum(["present", "late", "no_show", "cancelled"]) })
  .passthrough();
