/**
 * Shared date/time formatting utilities.
 * All formatters use explicit "en-US" locale for consistency across browsers.
 */

const LOCALE = "en-US" as const;

/**
 * "Jan 5, 2025"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * "January 5, 2025"
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * "3:30 PM"
 */
export function formatTime(time: string | Date | null | undefined): string {
  if (!time) return "—";
  // Handle "HH:MM" or "HH:MM:SS" strings
  if (typeof time === "string" && /^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d.toLocaleTimeString(LOCALE, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  const d = typeof time === "string" ? new Date(time) : time;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * "Jan 5, 2025, 3:30 PM"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * "Mon", "Tue", etc.
 */
export function formatDayOfWeek(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, { weekday: "short" });
}

/**
 * Relative time: "2 days ago", "in 3 hours", etc.
 * Falls back to formatDate for dates > 30 days old.
 */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  if (Math.abs(diffMins) < 1) return "just now";
  if (Math.abs(diffMins) < 60) {
    return diffMins > 0 ? `${diffMins}m ago` : `in ${Math.abs(diffMins)}m`;
  }
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `${diffHours}h ago` : `in ${Math.abs(diffHours)}h`;
  }
  if (Math.abs(diffDays) <= 30) {
    return diffDays > 0 ? `${diffDays}d ago` : `in ${Math.abs(diffDays)}d`;
  }
  return formatDate(d);
}
