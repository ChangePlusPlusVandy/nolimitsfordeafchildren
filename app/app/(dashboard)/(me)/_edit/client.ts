import type { UpdateMeInput } from "../_domain/types";
import { updateMe as serverUpdateMe } from "./actions";

export async function updateMe(input: UpdateMeInput) {
  return serverUpdateMe(input);
}
