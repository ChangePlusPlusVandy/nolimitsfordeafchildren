import type { Location } from "../_domain/types";
import { showLocation as serverShowLocation } from "./queries";

export async function getLocation(id: string): Promise<Location | null> {
  return serverShowLocation(id) as never;
}
