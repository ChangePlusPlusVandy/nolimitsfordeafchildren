/**
 * Canonical date helpers for No Limits for Deaf Children.
 *
 * ## Timezone decision
 *
 * The nonprofit is headquartered and operates on **Pacific Time**
 * (`America/Los_Angeles`). Cloudflare Workers run in UTC; teachers may be
 * anywhere in the US. All "what is today?" boundaries — attendance session
 * dates, My Day defaults, cron notification windows — use this org timezone
 * so behavior is consistent regardless of where code runs.
 *
 * Date-only strings stored in D1 (`session_date`, `cycle_start_date`, etc.)
 * are calendar dates with no time component. Helpers that interpret them use
 * plain Y-M-D arithmetic (via `Date.UTC`) so day-of-week and comparisons
 * never shift because of timezone.
 */

export const ORG_TIMEZONE = "America/Los_Angeles" as const;

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(dateStr: string): { year: number; month: number; day: number } {
  const match = DATE_ONLY_RE.exec(dateStr);
  if (!match) {
    throw new Error(`Invalid date-only string: ${dateStr}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function formatDateOnlyParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Today's calendar date in the org timezone as `YYYY-MM-DD`. */
export function todayStr(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ORG_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Day of week for a date-only string: 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(dateStr: string): number {
  const { year, month, day } = parseDateOnly(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDaysStr(dateStr: string, days: number): string {
  const { year, month, day } = parseDateOnly(dateStr);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateOnlyParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function compareDateStr(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isDateStrBefore(a: string, b: string): boolean {
  return a < b;
}

export function isDateStrAfter(a: string, b: string): boolean {
  return a > b;
}

export function isDateStrInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/** Whole-day difference from `from` to `to` (positive when `to` is later). */
export function daysBetweenDateStr(from: string, to: string): number {
  const a = parseDateOnly(from);
  const b = parseDateOnly(to);
  const fromMs = Date.UTC(a.year, a.month - 1, a.day);
  const toMs = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((toMs - fromMs) / 86_400_000);
}

/** Inclusive range of date-only strings from `start` through `end`. */
export function eachDateStrInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  while (compareDateStr(cursor, end) <= 0) {
    dates.push(cursor);
    cursor = addDaysStr(cursor, 1);
  }
  return dates;
}
