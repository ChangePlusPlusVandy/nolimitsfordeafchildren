"use server";

import { requireRole } from "@/_platform/auth/guard";

import { linkStudent as link, unlinkStudent as unlink } from "./service";
import { linkStudentSchema } from "./validation";

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

export async function linkStudentToParentUser(
  parentUserId: string,
  studentId: string,
  input: { relationship?: string | null; is_primary?: boolean } = {},
) {
  await requireRole("administrator");
  const parsed = linkStudentSchema.parse(input);
  return await link(parentUserId, studentId, parsed.relationship ?? undefined, parsed.is_primary);
}

export async function unlinkStudentFromParentUser(parentUserId: string, studentId: string) {
  await requireRole("administrator");
  return await unlink(parentUserId, studentId);
}
