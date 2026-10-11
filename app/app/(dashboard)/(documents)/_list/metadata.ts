import type { DocumentEntity } from "@/_platform/db/schema";
import { daysBetweenDateStr, todayStr } from "@/_shared/server/dates";

import type { DocumentWithMetadata } from "../_domain/types";

export type WithMetadata = (doc: DocumentEntity) => DocumentWithMetadata;

export function addMetadata(doc: DocumentEntity): DocumentWithMetadata {
  let isOverdue = false;
  let daysUntilDue: number | null = null;

  if (doc.next_due_date) {
    const today = todayStr();
    daysUntilDue = daysBetweenDateStr(today, doc.next_due_date);
    isOverdue = daysUntilDue < 0;
  }

  return {
    ...doc,
    is_overdue: isOverdue,
    days_until_due: daysUntilDue,
  };
}
