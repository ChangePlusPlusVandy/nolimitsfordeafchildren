import type { UserEntity } from "@/_platform/db/schema";

import { updateUser } from "../_edit/service";

export async function disableUser(id: string): Promise<UserEntity | null> {
  return updateUser(id, { is_active: false });
}

export async function enableUser(id: string): Promise<UserEntity | null> {
  return updateUser(id, { is_active: true });
}
