import { getCurrentUser } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";
import RequireAdmin from "@/_shared/ui/RequireAdmin";

import type { ScheduleDetails } from "../_domain/types";
import { getSchedule } from "./queries";
import ScheduleDetailView from "./ScheduleDetailView";

export default async function ScheduleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "administrator";

  let initialData: ScheduleDetails | null = null;
  if (isAdmin) {
    try {
      initialData = await getSchedule(id);
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }
  }

  return (
    <RequireAdmin>
      <ScheduleDetailView scheduleId={id} initialData={initialData} />
    </RequireAdmin>
  );
}
