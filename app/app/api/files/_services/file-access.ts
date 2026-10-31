import {
  assertCanAccessStudent,
  assertCanAccessTeacherRecord,
} from "@/(dashboard)/(students)/_domain/access";
import type { UserEntity } from "@/_platform/db/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/_shared/server/errors";

type FileUser = Pick<UserEntity, "id" | "role">;

/**
 * Authorize a download of an R2 object key. Throws Forbidden/NotFound/BadRequest.
 */
export async function authorizeDownload(user: FileUser, key: string): Promise<void> {
  await authorizeKeyPath(user, key);
}

/**
 * Authorize an upload to an R2 object key. Kept separate from downloads because
 * uploads run before the file's database row exists. Throws Forbidden/NotFound/BadRequest.
 */
export async function authorizeUpload(user: FileUser, key: string): Promise<void> {
  await authorizeKeyPath(user, key);
}

/** Validate a key and authorize it from its path segments alone. */
async function authorizeKeyPath(user: FileUser, key: string): Promise<void> {
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
