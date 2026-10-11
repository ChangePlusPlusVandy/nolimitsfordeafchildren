import { listLocations } from "@/(dashboard)/(locations)/_domain/queries";
import { getCurrentUser } from "@/_platform/auth/guard";
import RequireAdmin from "@/_shared/ui/RequireAdmin";

import type { ListTeachersQuery } from "../_domain/types";
import { listTeachers } from "./queries";
import TeachersClient from "./TeachersClient";

const DEFAULT_QUERY: ListTeachersQuery = {
  page: 1,
  limit: 20,
  sort: "name",
  order: "asc",
  is_active: true,
};

export default async function TeachersIndexPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "administrator";

  const [initialTeachers, initialLocationsResult] = isAdmin
    ? await Promise.all([
        listTeachers(DEFAULT_QUERY),
        listLocations({ page: 1, limit: 500, sort: "name", order: "asc" }),
      ])
    : [null, null];

  return (
    <RequireAdmin>
      <TeachersClient
        initialTeachers={initialTeachers}
        initialLocations={initialLocationsResult?.items ?? null}
        initialQueryParams={DEFAULT_QUERY}
      />
    </RequireAdmin>
  );
}
