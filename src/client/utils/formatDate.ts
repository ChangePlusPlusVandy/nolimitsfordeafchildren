/**
 * Shared date/time formatting utilities (ported from the legacy Vite app).
 * All formatters use explicit "en-US" locale for consistency across browsers.
 *
 * Date-only `YYYY-MM-DD` strings are formatted without timezone shifting via
 * `src/client/utils/date.ts` — never parse them with `new Date(dateStr)`.
 */

import { formatDateOnly } from "@/client/utils/date";

const LOCALE = "en-US" as const;
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isDateOnlyString(value: string): boolean {
  return DATE_ONLY_RE.test(value);
}

function parseToLocalDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const dateOnlyMatch = DATE_ONLY_RE.exec(value);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * "Jan 5, 2025"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  if (typeof date === "string" && isDateOnlyString(date)) {
    return formatDateOnly(date);
  }
  const d = parseToLocalDate(date);
  if (!d) return "—";
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
  if (typeof date === "string" && isDateOnlyString(date)) {
    return formatDateOnly(date, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  const d = parseToLocalDate(date);
  if (!d) return "—";
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
  const d = parseToLocalDate(time);
  if (!d) return "—";
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
  if (typeof date === "string" && isDateOnlyString(date)) {
    return formatDateOnly(date);
  }
  const d = parseToLocalDate(date);
  if (!d) return "—";
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
  if (typeof date === "string" && isDateOnlyString(date)) {
    return formatDateOnly(date, { weekday: "short" });
  }
  const d = parseToLocalDate(date);
  if (!d) return "—";
  return d.toLocaleDateString(LOCALE, { weekday: "short" });
}

/**
 * Relative time: "2 days ago", "in 3 hours", etc.
 * Falls back to formatDate for dates > 30 days old.
 */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = parseToLocalDate(date);
  if (!d) return "—";

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
