import assert from "node:assert/strict";
import test from "node:test";

import type { DocumentEntity } from "@/_platform/db/schema";

import { addMetadata } from "./metadata";

const document: DocumentEntity = {
  id: "document-id",
  entity_type: "student",
  entity_id: "student-id",
  document_type: "audiogram",
  file_url: "/api/files/documents/test.pdf",
  file_name: "hearing-test.pdf",
  file_size: null,
  mime_type: null,
  document_date: null,
  next_due_date: null,
  review_status: "approved",
  reviewed_by: null,
  reviewed_at: null,
  review_notes: null,
  session_date: null,
  session_type: null,
  uploaded_by: "user-id",
  created_at: new Date("2026-10-01T12:00:00Z"),
  updated_at: new Date("2026-10-01T12:00:00Z"),
};

test("documents without a due date retain null metadata", () => {
  assert.deepEqual(addMetadata(document), {
    ...document,
    is_overdue: false,
    days_until_due: null,
  });
});

test("overdue metadata uses the Pacific calendar date", (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-11T06:00:00Z") });

  for (const [date, days] of [
    ["2026-10-09", -1],
    ["2026-10-10", 0],
    ["2026-10-11", 1],
  ] as const) {
    const result = addMetadata({ ...document, next_due_date: date });
    assert.equal(result.days_until_due, days);
    assert.equal(result.is_overdue, days < 0);
  }

  assert.equal(document.next_due_date, null);
});
