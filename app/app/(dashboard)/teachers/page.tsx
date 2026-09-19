import { listLocations } from "@/server/locations/queries";
import { getCurrentUser } from "@/server/shared/auth-guard";
import { listTeachers } from "@/server/teachers/queries";
import type { ListTeachersQuery } from "@/server/teachers/service";

import RequireAdmin from "./RequireAdmin";
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
    <RequireAdmin redirectTo="/my-day">
      <TeachersClient
        initialTeachers={initialTeachers}
        initialLocations={initialLocationsResult?.items ?? null}
        initialQueryParams={DEFAULT_QUERY}
      />
    </RequireAdmin>
  );
}
