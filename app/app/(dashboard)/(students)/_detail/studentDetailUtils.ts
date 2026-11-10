export type AttendanceStatus = "present" | "late" | "no_show" | "cancelled";
export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

export const ABSENCE_REASON_OPTIONS: { value: AbsenceReason; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "family_emergency", label: "Family Emergency" },
  { value: "transportation", label: "Transportation" },
  { value: "schedule_conflict", label: "Schedule Conflict" },
  { value: "no_show_unknown", label: "No-show (Unknown)" },
  { value: "other", label: "Other" },
];

export function decodeDayMask(mask: number): string[] {
  const days: string[] = [];
  if (mask & 1) days.push("Sun");
  if (mask & 2) days.push("Mon");
  if (mask & 4) days.push("Tue");
  if (mask & 8) days.push("Wed");
  if (mask & 16) days.push("Thu");
  if (mask & 32) days.push("Fri");
  if (mask & 64) days.push("Sat");
  return days;
}

export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function formatHearingLossType(value: string | null): string {
  if (!value) {
    return "Not specified";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function attendanceStatusColor(status: AttendanceStatus) {
  switch (status) {
    case "present":
      return "success" as const;
    case "late":
      return "warning" as const;
    case "no_show":
      return "error" as const;
    default:
      return "default" as const;
  }
}

export function formatRoleLabel(role: "administrator" | "teacher" | "parent" | "unassigned") {
  if (role === "administrator") return "Admin";
  if (role === "teacher") return "Teacher";
  if (role === "unassigned") return "Pending";
  return "Parent";
}
