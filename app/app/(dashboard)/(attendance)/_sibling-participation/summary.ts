import type { AttendanceStatus, SiblingParticipationReportItem } from "../_domain/types";

type ParticipationRow = Omit<
  SiblingParticipationReportItem,
  "total_sessions" | "present_sessions"
> & { status: AttendanceStatus };

export function summarizeParticipation(rows: ParticipationRow[]) {
  const grouped = new Map<string, SiblingParticipationReportItem>();
  for (const row of rows) {
    const key = `${row.sibling_id}:${row.student_id}:${row.site_id}`;
    const current = grouped.get(key) ?? {
      sibling_id: row.sibling_id,
      sibling_name: row.sibling_name,
      student_id: row.student_id,
      student_initials: row.student_initials,
      site_id: row.site_id,
      site_name: row.site_name,
      total_sessions: 0,
      present_sessions: 0,
    };

    current.total_sessions += 1;
    if (row.status === "present" || row.status === "late") {
      current.present_sessions += 1;
    }

    grouped.set(key, current);
  }

  const items = Array.from(grouped.values()).sort((a, b) => {
    if (a.site_name !== b.site_name) {
      return a.site_name.localeCompare(b.site_name);
    }
    if (a.student_initials !== b.student_initials) {
      return a.student_initials.localeCompare(b.student_initials);
    }
    return a.sibling_name.localeCompare(b.sibling_name);
  });

  return {
    items,
    total: items.length,
  };
}
