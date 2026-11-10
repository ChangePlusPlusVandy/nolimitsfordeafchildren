import type { CreateLocationPayload, Location } from "../_domain/types";
import { createLocation as serverCreateLocation } from "./actions";

export async function createLocation(payload: CreateLocationPayload): Promise<Location> {
  return serverCreateLocation(payload as never) as never;
}
