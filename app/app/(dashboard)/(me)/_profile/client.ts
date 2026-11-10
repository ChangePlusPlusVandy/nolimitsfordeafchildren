import type { MeProfile } from "../_domain/types";
import { getMe as getMeQuery } from "./queries";

export async function getMe(): Promise<MeProfile> {
  return getMeQuery() as never;
}
