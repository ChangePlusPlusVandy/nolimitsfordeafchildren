"use server";

import { z } from "zod";
import { type CreateSessionInput, SessionsService } from "@/server/sessions/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError } from "@/server/shared/errors";

const createSessionSchema = z
  .object({
    name: z.string().min(1).max(200),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .passthrough();

const updateSessionSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    is_active: z.boolean().optional(),
    is_archived: z.boolean().optional(),
  })
  .passthrough();

/**
 * POST /v1/sessions — create a teaching cycle (admin only).
 */
export async function createSession(input: CreateSessionInput) {
  await requireRole("administrator");

  if (!input.name || !input.start_date || !input.end_date) {
    throw new HttpError(400, "BAD_REQUEST", "name, start_date, and end_date are required");
  }

  const parsed = createSessionSchema.parse(input) as CreateSessionInput;

  try {
    return await new SessionsService().create(parsed);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("required") || error.message.includes("must be")) {
        throw new HttpError(422, "UNPROCESSABLE_ENTITY", error.message);
      }
      if (error.message.includes("already exists")) {
        throw new HttpError(409, "CONFLICT", error.message);
      }
    }
    throw error;
  }
}

/**
 * PATCH /v1/sessions/:id — update a teaching cycle (admin only).
 */
export async function updateSession(
  id: string,
  input: Partial<CreateSessionInput> & { is_active?: boolean; is_archived?: boolean },
) {
  await requireRole("administrator");
  const parsed = updateSessionSchema.parse(input);

  try {
    const updated = await new SessionsService().update(id, parsed);
    if (!updated) {
      throw new HttpError(404, "NOT_FOUND", "Session not found");
    }
    return updated;
  } catch (error) {
    if (error instanceof Error && error.message.includes("must be")) {
      throw new HttpError(422, "UNPROCESSABLE_ENTITY", error.message);
    }
    throw error;
  }
}
