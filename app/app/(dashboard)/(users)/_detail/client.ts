import type { User } from "../_domain/types";
import { getUser as serverGetUser } from "./queries";

export async function getUserDetails(id: string): Promise<User> {
  return serverGetUser(id) as never as never;
}
