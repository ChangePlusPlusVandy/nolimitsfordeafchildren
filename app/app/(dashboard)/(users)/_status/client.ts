import type { User } from "../_domain/types";
import { disableUser as serverDisableUser, enableUser as serverEnableUser } from "./actions";

export async function disableUser(id: string): Promise<{ success: boolean; message: string }> {
  return serverDisableUser(id) as never;
}

export async function enableUser(id: string): Promise<User> {
  return serverEnableUser(id) as never;
}
