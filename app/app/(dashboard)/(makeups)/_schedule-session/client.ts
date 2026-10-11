import { createMakeupSession as createSession } from "./actions";
import type { CreateMakeupSessionInput } from "./types";

export async function createMakeupSession(input: Omit<CreateMakeupSessionInput, "created_by">) {
  return createSession(input);
}
