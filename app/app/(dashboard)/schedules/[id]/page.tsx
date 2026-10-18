import ScheduleDetailView from "@/client/components/schedules/ScheduleDetailView";
import { getSchedule } from "@/server/schedules/queries";
import type { ScheduleDetails } from "@/server/schedules/service";
import { getCurrentUser } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

import RequireAdmin from "../../teachers/RequireAdmin";

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
