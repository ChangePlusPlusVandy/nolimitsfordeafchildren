"use server";

import { z } from "zod";
import { requireRole } from "@/server/shared/auth-guard";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";
import { type InviteUserInput, type UpdateUserInput, UsersService } from "@/server/users/service";

/**
 * Client-facing aliases (src/client/users.ts imports these names).
 */
export async function linkStudent(
  parentUserId: string,
  studentId: string,
  input: { relationship?: string | null; is_primary?: boolean } = {},
) {
  return await linkStudentToParentUser(parentUserId, studentId, input);
}

export async function unlinkStudent(parentUserId: string, studentId: string) {
  return await unlinkStudentFromParentUser(parentUserId, studentId);
}

const userRoleSchema = z.enum(["administrator", "teacher", "parent", "unassigned"]);

const linkStudentSchema = z
  .object({
    relationship: z.string().max(100).nullable().optional(),
    is_primary: z.boolean().optional(),
  })
  .passthrough();

const inviteUserSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).max(200),
    role: userRoleSchema,
    phone: z.string().max(50).nullable().optional(),
    primary_site_id: z.string().optional(),
  })
  .passthrough();

const updateUserSchema = z
  .object({
    name: z.string().max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(50).nullable().optional(),
    photo_url: z.string().max(500).nullable().optional(),
    locale: z.string().max(20).optional(),
    role: userRoleSchema.optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

/**
 * POST /v1/users/:id/students/:studentId — link a student to a parent user
 * (admin only).
 */
export async function linkStudentToParentUser(
  parentUserId: string,
  studentId: string,
  input: { relationship?: string | null; is_primary?: boolean } = {},
) {
  await requireRole("administrator");
  const parsed = linkStudentSchema.parse(input);
  return await new UsersService().linkStudentToParentUser(
    parentUserId,
    studentId,
    parsed.relationship ?? undefined,
    parsed.is_primary,
  );
}

/**
 * DELETE /v1/users/:id/students/:studentId — unlink (admin only).
 */
export async function unlinkStudentFromParentUser(parentUserId: string, studentId: string) {
  await requireRole("administrator");
  return await new UsersService().unlinkStudentFromParentUser(parentUserId, studentId);
}

/**
 * POST /v1/users/invite — invite a new user (admin only).
 */
export async function inviteUser(input: InviteUserInput) {
  await requireRole("administrator");

  if (!input.email || !input.name || !input.role) {
    throw new BadRequestError("email, name, and role are required");
  }
  if (!["administrator", "teacher", "parent", "unassigned"].includes(input.role)) {
    throw new BadRequestError("role must be administrator, teacher, parent, or unassigned");
  }

  const parsed = inviteUserSchema.parse(input) as InviteUserInput;

  try {
    return await new UsersService().invite(parsed);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
}

/**
 * PATCH /v1/users/:id — update a user (admin only).
 */
export async function updateUser(id: string, input: UpdateUserInput) {
  await requireRole("administrator");
  const parsed = updateUserSchema.parse(input) as UpdateUserInput;

  try {
    const user = await new UsersService().update(id, parsed);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  } catch (error) {
    if (error instanceof Error && error.message.includes("already in use")) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
}

/**
 * DELETE /v1/users/:id — disable (soft delete) a user (admin only).
 */
export async function disableUser(id: string) {
  await requireRole("administrator");
  const user = await new UsersService().disable(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return { success: true, message: "User disabled" };
}

/**
 * POST /v1/users/:id/enable — re-enable a disabled user (admin only).
 */
export async function enableUser(id: string) {
  await requireRole("administrator");
  const user = await new UsersService().enable(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}
