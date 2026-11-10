import type { UserEntity } from "@/_platform/db/schema";

import { photoAccess } from "../_access/service";

type AccessUser = Pick<UserEntity, "id" | "role">;

/** Throws ForbiddenError unless the gallery would show this photo file to the user. */
export function assertCanViewPhotoFile(fileUrl: string, user: AccessUser): Promise<void> {
  return photoAccess.assertCanViewFile(fileUrl, user);
}

/** Throws ForbiddenError unless the user may upload photos to this location. */
export function assertCanUploadPhotoToLocation(
  locationId: string,
  user: AccessUser,
): Promise<void> {
  return photoAccess.assertCanUploadToLocation(locationId, user);
}
