"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";
import { BadRequestError, NotFoundError } from "@/_shared/server/errors";

import type { CreateSessionInput } from "../_domain/types";
import { sessionManagement } from "./service";

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

export async function createSession(input: CreateSessionInput) {
  await requireRole("administrator");

  if (!input.name || !input.start_date || !input.end_date) {
    throw new BadRequestError("name, start_date, and end_date are required");
  }

  const parsed = createSessionSchema.parse(input) as CreateSessionInput;

  return await sessionManagement.create(parsed);
}

export async function updateSession(
  id: string,
  input: Partial<CreateSessionInput> & { is_active?: boolean; is_archived?: boolean },
) {
  await requireRole("administrator");
  const parsed = updateSessionSchema.parse(input);

  const updated = await sessionManagement.update(id, parsed);
  if (!updated) {
    throw new NotFoundError("Session not found");
  }
  return updated;
}
