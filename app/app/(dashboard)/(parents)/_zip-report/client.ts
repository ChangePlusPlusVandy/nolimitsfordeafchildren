import type { PaginatedResponse, ParentZipReportGroup } from "../_domain/types";
import { zipReport } from "./queries";

export async function getZipReport(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ParentZipReportGroup>> {
  return zipReport(params);
}
