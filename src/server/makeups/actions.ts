"use server";

import { z } from "zod";
import {
  type CreateMakeupRequestInput,
  type CreateMakeupSessionInput,
  MakeupService,
} from "@/server/makeups/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError, NotFoundError } from "@/server/shared/errors";

const createRequestSchema = z
  .object({
    student_id: z.string().min(1),
    original_session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    original_schedule_id: z.string().min(1),
    reason: z.enum([
      "sick",
      "family_emergency",
      "transportation",
      "schedule_conflict",
      "no_show_unknown",
      "other",
    ]),
    reason_text: z.string().max(1000).optional(),
    preferred_dates: z.string().max(500).optional(),
  })
  .passthrough();

const reviewRequestSchema = z
  .object({
    status: z.enum(["approved", "denied"]),
    review_notes: z.string().max(2000).optional(),
  })
  .passthrough();

const createSessionSchema = z
  .object({
    makeup_request_id: z.string().optional(),
    student_id: z.string().min(1),
    teacher_id: z.string().min(1),
    site_id: z.string().min(1),
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    scheduled_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    notes: z.string().max(2000).optional(),
  })
  .passthrough();

const markAttendanceSchema = z
  .object({
    status: z.enum(["present", "late", "no_show", "cancelled"]),
  })
  .passthrough();

/**
 * POST /v1/makeup-requests — create a makeup request (parent | administrator).
 */
export async function createMakeupRequest(input: Omit<CreateMakeupRequestInput, "requested_by">) {
  const currentUser = await requireRole("parent", "administrator");
  const parsed = createRequestSchema.parse(input) as Omit<CreateMakeupRequestInput, "requested_by">;

  try {
    return await new MakeupService().createRequest({
      ...parsed,
      requested_by: currentUser.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        throw new HttpError(409, "CONFLICT", error.message);
      }
      if (error.message.includes("not found")) {
        throw new HttpError(404, "NOT_FOUND", error.message);
      }
    }
    throw error;
  }
}

/**
 * PATCH /v1/makeup-requests/:id — review (admin only).
 */
export async function reviewMakeupRequest(
  id: string,
  input: { status: "approved" | "denied"; review_notes?: string },
) {
  const currentUser = await requireRole("administrator");
  const parsed = reviewRequestSchema.parse(input);

  try {
    const request = await new MakeupService().reviewRequest(
      id,
      currentUser.id,
      parsed.status,
      parsed.review_notes,
    );
    if (!request) {
      throw new NotFoundError("Makeup request not found");
    }
    return request;
  } catch (error) {
    if (error instanceof Error && error.message.includes("already been reviewed")) {
      throw new HttpError(409, "CONFLICT", error.message);
    }
    throw error;
  }
}

/**
 * POST /v1/makeup-sessions — create a makeup session (admin only).
 */
export async function createMakeupSession(input: Omit<CreateMakeupSessionInput, "created_by">) {
  const currentUser = await requireRole("administrator");
  const parsed = createSessionSchema.parse(input) as Omit<CreateMakeupSessionInput, "created_by">;

  try {
    return await new MakeupService().createSession({
      ...parsed,
      created_by: currentUser.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      throw new HttpError(404, "NOT_FOUND", error.message);
    }
    throw error;
  }
}

/**
 * PATCH /v1/makeup-sessions/:id/attendance — mark attendance
 * (administrator | teacher).
 */
export async function markMakeupSessionAttendance(
  id: string,
  input: { status: "present" | "late" | "no_show" | "cancelled" },
) {
  await requireRole("administrator", "teacher");
  const parsed = markAttendanceSchema.parse(input);

  const session = await new MakeupService().markSessionAttendance(id, parsed.status);
  if (!session) {
    throw new NotFoundError("Makeup session not found");
  }
  return session;
}
