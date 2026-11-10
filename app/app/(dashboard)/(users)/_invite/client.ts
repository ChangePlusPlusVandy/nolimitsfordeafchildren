import type { InviteUserInput } from "../_domain/types";
import { inviteUser as serverInviteUser } from "./actions";

export async function inviteUser(payload: InviteUserInput) {
  return serverInviteUser(payload);
}
