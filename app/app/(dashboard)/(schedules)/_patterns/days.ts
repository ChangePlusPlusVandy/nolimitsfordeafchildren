const DAY_MASKS = {
  Sun: 1,
  Mon: 2,
  Tue: 4,
  Wed: 8,
  Thu: 16,
  Fri: 32,
  Sat: 64,
};

export function decodeDayMask(mask: number): string[] {
  const days: string[] = [];
  for (const [day, bit] of Object.entries(DAY_MASKS)) {
    if (mask & bit) {
      days.push(day);
    }
  }
  return days;
}

export function encodeDayMask(days: string[]): number {
  let mask = 0;
  for (const [day, bit] of Object.entries(DAY_MASKS)) {
    if (days.includes(day)) {
      mask |= bit;
    }
  }
  return mask;
}

export const SCHEDULE_PATTERNS = {
  MWS: { label: "Mon/Wed/Sat", mask: 74 },
  TThS: { label: "Tue/Thu/Sat", mask: 84 },
};
