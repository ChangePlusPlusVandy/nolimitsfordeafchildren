import { createMakeupRequest as createRequest } from "./actions";
import type { CreateMakeupRequestInput } from "./types";

export async function createMakeupRequest(input: Omit<CreateMakeupRequestInput, "requested_by">) {
  return createRequest(input);
}
