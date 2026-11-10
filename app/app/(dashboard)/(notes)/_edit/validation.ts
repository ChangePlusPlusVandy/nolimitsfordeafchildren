import { z } from "zod";

export const updateNoteSchema = z.object({ note: z.string().min(1).max(5000) }).passthrough();
