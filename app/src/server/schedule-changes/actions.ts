"use server";

import { z } from "zod";

import {
  type CreateScheduleChangeInput,
  ScheduleChangeService,
} from "@/server/schedule-changes/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

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

export async function createScheduleChangeRequest(
  input: Omit<CreateScheduleChangeInput, "requested_by">,
) {
  const currentUser = await requireRole("parent", "administrator");
  const parsed = createRequestSchema.parse(input) as Omit<
    CreateScheduleChangeInput,
    "requested_by"
  >;

  return await new ScheduleChangeService().createRequest({
    ...parsed,
    requested_by: currentUser.id,
  });
}

export async function reviewScheduleChangeRequest(
  id: string,
  input: { status: "approved" | "denied" | "negotiating"; review_notes?: string },
) {
  const currentUser = await requireRole("administrator");
  const parsed = reviewRequestSchema.parse(input);

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
}

export async function teacherRespond(
  id: string,
  input: { response_status: "available" | "unavailable" | "conditional"; notes?: string },
) {
  const currentUser = await requireRole("teacher");
  const parsed = teacherResponseSchema.parse(input);

  const updated = await new ScheduleChangeService().teacherRespond(id, currentUser.id, parsed);
  if (!updated) {
    throw new NotFoundError("Schedule change request not found");
  }
  return updated;
}
