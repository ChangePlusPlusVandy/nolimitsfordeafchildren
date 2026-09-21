/**
 * Client-side date-only formatting and org-calendar helpers.
 *
 * Mirrors `src/server/shared/dates.ts` for org timezone and Y-M-D arithmetic.
 * Never parse `YYYY-MM-DD` with `new Date(dateStr)` — that treats the value as
 * UTC midnight and shifts the displayed day in US timezones.
 */

export const ORG_TIMEZONE = "America/Los_Angeles" as const;

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const LOCALE = "en-US" as const;

function parseDateOnlyParts(dateStr: string): { year: number; month: number; day: number } | null {
  const match = DATE_ONLY_RE.exec(dateStr);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function formatDateOnlyParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Today's calendar date in the org timezone as `YYYY-MM-DD`. */
export function todayStrOrg(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ORG_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function dayOfWeek(dateStr: string): number {
  const parts = parseDateOnlyParts(dateStr);
  if (!parts) return 0;
  const { year, month, day } = parts;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDaysStr(dateStr: string, days: number): string {
  const parts = parseDateOnlyParts(dateStr);
  if (!parts) return dateStr;
  const { year, month, day } = parts;
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateOnlyParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/**
 * Format a date-only `YYYY-MM-DD` string without timezone shifting.
 */
export function formatDateOnly(
  dateStr: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
): string {
  if (!dateStr) return "—";
  const parts = parseDateOnlyParts(dateStr);
  if (!parts) return "—";
  const d = new Date(parts.year, parts.month - 1, parts.day);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, options);
}

export function formatDateOnlyWeekdayLong(dateStr: string): string {
  return formatDateOnly(dateStr, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateOnlyWeekdayShort(dateStr: string): string {
  return formatDateOnly(dateStr, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateOnlySiteHeader(dateStr: string): string {
  return formatDateOnly(dateStr, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function getWeekDatesFromDateStr(dateStr: string): string[] {
  const dow = dayOfWeek(dateStr);
  const weekStart = addDaysStr(dateStr, -dow);
  return Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));
}

export function getWeekRangeLabels(dateStr: string): { startOfWeek: string; endOfWeek: string } {
  const weekDates = getWeekDatesFromDateStr(dateStr);
  const start = weekDates[0] ?? dateStr;
  const end = weekDates[6] ?? dateStr;
  const longOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return {
    startOfWeek: formatDateOnly(start, longOptions),
    endOfWeek: formatDateOnly(end, longOptions),
  };
}
