import type { Location, UpdateLocationPayload } from "../_domain/types";
import { updateLocation as serverUpdateLocation } from "./actions";

export async function updateLocation({
  id,
  payload,
}: {
  id: string;
  payload: UpdateLocationPayload;
}): Promise<Location> {
  return serverUpdateLocation(id, payload as never) as never;
}
