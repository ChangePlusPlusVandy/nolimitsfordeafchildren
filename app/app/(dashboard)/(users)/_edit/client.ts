import type { UpdateUserInput } from "../_domain/types";
import { updateUser as serverUpdateUser } from "./actions";

export async function updateUser(payload: UpdateUserInput & { id: string }) {
  const { id, ...data } = payload;
  return serverUpdateUser(id, data);
}
