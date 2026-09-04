"use server";

import { z } from "zod";
import {
  type CreateScheduleChangeInput,
  ScheduleChangeService,
} from "@/server/schedule-changes/service";
import { requireRole } from "@/server/shared/auth-guard";
import { HttpError, NotFoundError } from "@/server/shared/errors";

const createRequestSchema = z
  .object({
    student_id: z.string().min(1),
    current_schedule_id: z.string().min(1),
    requested_schedule_id: z.string().optional(),
    preferred_times: z.string().max(500).optional(),
    flexibility_notes: z.string().max(2000).optional(),
    reason: z.string().min(1).max(2000),
  })
  .passthrough();

const reviewRequestSchema = z
  .object({
    status: z.enum(["approved", "denied", "negotiating"]),
    review_notes: z.string().max(2000).optional(),
  })
  .passthrough();

const teacherResponseSchema = z
  .object({
    response_status: z.enum(["available", "unavailable", "conditional"]),
    notes: z.string().max(2000).optional(),
  })
  .passthrough();

/**
 * POST /v1/schedule-change-requests — create (parent | administrator).
 */
export async function createScheduleChangeRequest(
  input: Omit<CreateScheduleChangeInput, "requested_by">,
) {
  const currentUser = await requireRole("parent", "administrator");
  const parsed = createRequestSchema.parse(input) as Omit<
    CreateScheduleChangeInput,
    "requested_by"
  >;

  try {
    return await new ScheduleChangeService().createRequest({
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
 * PATCH /v1/schedule-change-requests/:id — review (admin only).
 */
export async function reviewScheduleChangeRequest(
  id: string,
  input: { status: "approved" | "denied" | "negotiating"; review_notes?: string },
) {
  const currentUser = await requireRole("administrator");
  const parsed = reviewRequestSchema.parse(input);

  try {
    const request = await new ScheduleChangeService().reviewRequest(
      id,
      currentUser.id,
      parsed.status,
      parsed.review_notes,
    );
    if (!request) {
      throw new NotFoundError("Schedule change request not found");
    }
    return request;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("already been finalized")) {
        throw new HttpError(409, "CONFLICT", error.message);
      }
      if (error.message.includes("Cannot approve without a requested schedule")) {
        throw new HttpError(422, "UNPROCESSABLE_ENTITY", error.message);
      }
    }
    throw error;
  }
}

/**
 * PATCH /v1/schedule-change-requests/:id/teacher-response — teacher only.
 */
export async function teacherRespond(
  id: string,
  input: { response_status: "available" | "unavailable" | "conditional"; notes?: string },
) {
  const currentUser = await requireRole("teacher");
  const parsed = teacherResponseSchema.parse(input);

  try {
    const updated = await new ScheduleChangeService().teacherRespond(id, currentUser.id, parsed);
    if (!updated) {
      throw new NotFoundError("Schedule change request not found");
    }
    return updated;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Teacher is not assigned")) {
        throw new HttpError(403, "FORBIDDEN", error.message);
      }
      if (error.message.includes("not found")) {
        throw new HttpError(404, "NOT_FOUND", error.message);
      }
    }
    throw error;
  }
}
