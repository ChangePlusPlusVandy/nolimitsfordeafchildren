import type { StudentFilters } from "../_domain/types";

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return undefined;
}

export function buildInitialQueryParams(
  searchParams: Record<string, string | string[] | undefined>,
): StudentFilters {
  const page = Number(getParam(searchParams, "page") || 1);
  const limit = Number(getParam(searchParams, "limit") || 20);
  const sort = (getParam(searchParams, "sort") || "initials") as StudentFilters["sort"];
  const order = (getParam(searchParams, "order") as "asc" | "desc") || "asc";
  const search = getParam(searchParams, "search");
  const site_id = getParam(searchParams, "site_id");
  const activeFilter = getParam(searchParams, "active") || "active";

  return {
    page,
    limit,
    sort,
    order,
    ...(search && { search }),
    ...(site_id && { site_id }),
    ...(activeFilter !== "all" && { is_active: activeFilter === "active" }),
  };
}
