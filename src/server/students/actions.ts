"use server";

import { z } from "zod";
import { requireRole } from "@/server/shared/auth-guard";
import { ForbiddenError, HttpError, NotFoundError } from "@/server/shared/errors";
import {
  type AddSiblingInput,
  type CreateStudentInput,
  StudentsService,
  type UpdateSiblingInput,
  type UpdateStudentInput,
} from "@/server/students/service";

const createStudentSchema = z
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

const updateStudentSchema = createStudentSchema
  .partial()
  .extend({ is_active: z.boolean().optional() })
  .passthrough();

const siblingSchema = z
  .object({
    name: z.string().max(200),
    age: z.number().int().min(0).max(21).optional(),
    relationship: z.string().max(100),
    is_participant: z.boolean().optional(),
    has_hearing_loss: z.boolean().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .passthrough();

const guardianSummarySchema = z
  .object({
    guardian_summary: z.string().max(5000).nullable().optional(),
  })
  .passthrough();

const linkParentSchema = z
  .object({
    parent_id: z.string().min(1),
    relationship: z.string().max(100).nullable().optional(),
    is_primary: z.boolean().optional(),
  })
  .passthrough();

/**
 * POST /v1/students — create a student (admin only).
 */
export async function createStudent(input: CreateStudentInput) {
  await requireRole("administrator");
  const parsed = createStudentSchema.parse(input) as CreateStudentInput;
  return await new StudentsService().create(parsed);
}

/**
 * PATCH /v1/students/:id — update a student (admin only).
 */
export async function updateStudent(id: string, input: UpdateStudentInput) {
  await requireRole("administrator");
  const parsed = updateStudentSchema.parse(input) as UpdateStudentInput;
  const student = await new StudentsService().update(id, parsed);
  if (!student) {
    throw new NotFoundError("Student not found");
  }
  return student;
}

/**
 * PATCH /v1/students/:id/guardian-summary — admin | teacher.
 */
export async function updateGuardianSummary(
  id: string,
  input: { guardian_summary?: string | null },
) {
  const user = await requireRole("administrator", "teacher");
  const parsed = guardianSummarySchema.parse(input);

  const normalizedSummary =
    parsed.guardian_summary === undefined
      ? null
      : parsed.guardian_summary?.trim()
        ? parsed.guardian_summary.trim()
        : null;

  try {
    const student = await new StudentsService().updateGuardianSummary(id, normalizedSummary, {
      id: user.id,
      role: user.role,
    });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    return student;
  } catch (error) {
    if (error instanceof Error && error.message.includes("permission")) {
      throw new ForbiddenError(error.message);
    }
    if (error instanceof Error && error.message.includes("Teacher profile not found")) {
      throw new HttpError(403, "FORBIDDEN", error.message);
    }
    throw error;
  }
}

/**
 * POST /v1/students/:id/teachers — link a teacher (admin only).
 */
export async function linkStudentTeacher(id: string, teacherId: string) {
  await requireRole("administrator");
  return await new StudentsService().linkTeacher(id, teacherId);
}

/**
 * DELETE /v1/students/:id/teachers/:teacherId — unlink (admin only).
 */
export async function unlinkStudentTeacher(id: string, teacherId: string) {
  await requireRole("administrator");
  return await new StudentsService().unlinkTeacher(id, teacherId);
}

/**
 * POST /v1/students/:id/parents — link a parent (admin only).
 */
export async function linkStudentParent(
  id: string,
  input: { parent_id: string; relationship?: string | null; is_primary?: boolean },
) {
  await requireRole("administrator");
  const parsed = linkParentSchema.parse(input);
  return await new StudentsService().linkParent(
    id,
    parsed.parent_id,
    parsed.relationship ?? undefined,
    parsed.is_primary,
  );
}

/**
 * DELETE /v1/students/:id/parents/:parentId — unlink (admin only).
 */
export async function unlinkStudentParent(id: string, parentId: string) {
  await requireRole("administrator");
  return await new StudentsService().unlinkParent(id, parentId);
}

/**
 * POST /v1/students/:id/siblings — add a sibling (admin only).
 */
export async function addSibling(id: string, input: AddSiblingInput) {
  await requireRole("administrator");
  const parsed = siblingSchema.parse(input) as AddSiblingInput;
  return await new StudentsService().addSibling(id, parsed);
}

/**
 * PATCH /v1/siblings/:id — update a sibling (admin only).
 */
export async function updateSibling(id: string, input: UpdateSiblingInput) {
  await requireRole("administrator");
  const parsed = siblingSchema.partial().parse(input) as UpdateSiblingInput;
  const sibling = await new StudentsService().updateSibling(id, parsed);
  if (!sibling) {
    throw new NotFoundError("Sibling not found");
  }
  return sibling;
}

/**
 * DELETE /v1/siblings/:id — remove a sibling (admin only).
 */
export async function removeSibling(id: string) {
  await requireRole("administrator");
  return await new StudentsService().removeSibling(id);
}
