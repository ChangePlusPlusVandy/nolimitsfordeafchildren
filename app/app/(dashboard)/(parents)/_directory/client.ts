import type { DirectoryPerson, PaginatedResponse } from "../_domain/types";
import { directory } from "./queries";

export async function getDirectory(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<DirectoryPerson>> {
  return directory(params);
}
