import {
  assertCanAccessStudent,
  assertCanAccessTeacherRecord,
} from "@/(dashboard)/(students)/_domain/access";
import type { UserEntity } from "@/_platform/db/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/_shared/server/errors";

/**
 * Authorize read/write of an R2 object key. Throws Forbidden/NotFound/BadRequest.
 */
export async function authorizeObjectKey(
  user: Pick<UserEntity, "id" | "role">,
  key: string,
): Promise<void> {
  if (!key || key.includes("..") || key.startsWith("/")) {
    throw new BadRequestError("Invalid file key");
  }

  const segments = key.split("/");
  const purpose = segments[0];

  if (purpose === "photos" || purpose === "bulletins") {
    return;
  }

  if (purpose !== "documents") {
    throw new NotFoundError("File not found");
  }

  const entityType = segments[1];
  const entityId = segments[2];
  if (!entityType || !entityId) {
    throw new NotFoundError("File not found");
  }

  if (entityType === "student") {
    try {
      await assertCanAccessStudent(user, entityId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ForbiddenError("You cannot access this student's files");
      }
      throw error;
    }
    return;
  }

  if (entityType === "teacher") {
    await assertCanAccessTeacherRecord(user, entityId);
    return;
  }

  throw new NotFoundError("File not found");
}
