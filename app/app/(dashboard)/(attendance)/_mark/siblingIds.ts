export function normalizeSiblingParticipantIds(ids?: string[]): string[] {
  if (!ids || ids.length === 0) {
    return [];
  }

  return Array.from(new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)));
}
