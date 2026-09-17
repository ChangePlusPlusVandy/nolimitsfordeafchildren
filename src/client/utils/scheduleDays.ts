/**
 * Decode schedule day_of_week_mask (Sun=1<<0 … Sat=1<<6) to short labels.
 */
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

export function formatDayMask(mask: number): string {
  return decodeDayMask(mask).join("/");
}
