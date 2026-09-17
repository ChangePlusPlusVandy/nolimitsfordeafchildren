import type { AbsenceReason, AttendanceStatus } from "@/client/attendance";

export const ABSENCE_REASONS: { value: AbsenceReason; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "family_emergency", label: "Family Emergency" },
  { value: "transportation", label: "Transportation Issue" },
  { value: "schedule_conflict", label: "Schedule Conflict" },
  { value: "no_show_unknown", label: "No Show (Unknown)" },
  { value: "other", label: "Other" },
];

export function getStatusColor(
  status: AttendanceStatus | undefined,
): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "present":
      return "success";
    case "late":
      return "warning";
    case "no_show":
      return "error";
    case "cancelled":
      return "default";
    default:
      return "default";
  }
}

export function getStatusBorderColor(
  status: AttendanceStatus | undefined,
): "success.main" | "warning.main" | "error.main" | "grey.400" {
  switch (status) {
    case "present":
      return "success.main";
    case "late":
      return "warning.main";
    case "no_show":
      return "error.main";
    default:
      return "grey.400";
  }
}

export function getStatusLabel(status: AttendanceStatus | undefined): string {
  switch (status) {
    case "present":
      return "Present";
    case "late":
      return "Late";
    case "no_show":
      return "No Show";
    case "cancelled":
      return "Cancelled";
    default:
      return "Not Marked";
  }
}
