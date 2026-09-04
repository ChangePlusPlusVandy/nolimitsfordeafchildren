"use server";

import { z } from "zod";
import { ProfilesService } from "@/server/profiles/service";
import { requireRole } from "@/server/shared/auth-guard";
import { ForbiddenError } from "@/server/shared/errors";

const profileUpdateSchema = z.record(z.string(), z.unknown());

/**
 * PATCH /v1/profiles/teacher/:userId — admin updates any, teacher only own.
 */
export async function updateTeacherProfile(userId: string, body: Record<string, unknown>) {
  const currentUser = await requireRole("administrator", "teacher");
  if (currentUser.role === "teacher" && currentUser.id !== userId) {
    throw new ForbiddenError("You can only update your own profile");
  }
  const parsed = profileUpdateSchema.parse(body);
  return await new ProfilesService().updateTeacher(userId, parsed);
}

/**
 * PATCH /v1/profiles/parent/:userId — admin updates any, parent only own.
 */
export async function updateParentProfile(userId: string, body: Record<string, unknown>) {
  const currentUser = await requireRole("administrator", "parent");
  if (currentUser.role === "parent" && currentUser.id !== userId) {
    throw new ForbiddenError("You can only update your own profile");
  }
  const parsed = profileUpdateSchema.parse(body);
  return await new ProfilesService().updateParent(userId, parsed);
}
