import { ProfilesService } from "@/server/profiles/service";
import { requireRole } from "@/server/shared/auth-guard";
import { ForbiddenError } from "@/server/shared/errors";

/**
 * GET /v1/profiles/teacher/:userId — admin sees any, teacher only their own.
 */
export async function getTeacherProfile(userId: string) {
  const currentUser = await requireRole("administrator", "teacher");
  if (currentUser.role === "teacher" && currentUser.id !== userId) {
    throw new ForbiddenError("You can only view your own profile");
  }
  return await new ProfilesService().getTeacher(userId);
}

/**
 * GET /v1/profiles/parent/:userId — admin sees any, parent only their own.
 */
export async function getParentProfile(userId: string) {
  const currentUser = await requireRole("administrator", "parent");
  if (currentUser.role === "parent" && currentUser.id !== userId) {
    throw new ForbiddenError("You can only view your own profile");
  }
  return await new ProfilesService().getParent(userId);
}
