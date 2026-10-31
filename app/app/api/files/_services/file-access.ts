import {
  assertCanUploadPhotoToLocation,
  assertCanViewPhotoFile,
} from "@/(dashboard)/(photos)/_domain/access";
import {
  assertCanAccessStudent,
  assertCanAccessTeacherRecord,
} from "@/(dashboard)/(students)/_domain/access";
import type { UserEntity } from "@/_platform/db/schema";
import { getPublicUrl } from "@/_platform/storage/r2";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/_shared/server/errors";

type FileUser = Pick<UserEntity, "id" | "role">;

/**
 * Authorize a download of an R2 object key. Throws Forbidden/NotFound/BadRequest.
 */
export async function authorizeDownload(user: FileUser, key: string): Promise<void> {
  const segments = splitKey(key);

  if (segments[0] === "photos") {
    // Same visibility as the photo gallery, resolved from the photo's row.
    await assertCanViewPhotoFile(getPublicUrl(key), user);
    return;
  }

  await authorizeKeyPath(user, segments);
}

/**
 * Authorize an upload to an R2 object key. Kept separate from downloads because
 * uploads run before the file's database row exists. Throws Forbidden/NotFound/BadRequest.
 */
export async function authorizeUpload(user: FileUser, key: string): Promise<void> {
  const segments = splitKey(key);

  if (segments[0] === "photos") {
    // Keys are `photos/location/<locationId>/…`; check the location before the file lands.
    const locationId = segments[1] === "location" ? segments[2] : undefined;
    if (!locationId) {
      throw new NotFoundError("File not found");
    }
    await assertCanUploadPhotoToLocation(locationId, user);
    return;
  }

  await authorizeKeyPath(user, segments);
}

function splitKey(key: string): string[] {
  if (!key || key.includes("..") || key.startsWith("/")) {
    throw new BadRequestError("Invalid file key");
  }
  return key.split("/");
}

/** Authorize a key from its path segments alone. */
async function authorizeKeyPath(user: FileUser, segments: string[]): Promise<void> {
  const purpose = segments[0];

  if (purpose === "bulletins") {
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
