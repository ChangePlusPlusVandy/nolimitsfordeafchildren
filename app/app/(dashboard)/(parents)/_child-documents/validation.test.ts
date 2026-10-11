import assert from "node:assert/strict";
import { test } from "node:test";

import { confirmUploadSchema, uploadUrlSchema } from "./validation";

test("upload validation strips caller-supplied ownership", () => {
  const input = {
    document_type: "audiogram",
    file_name: "hearing.pdf",
    content_type: "application/pdf",
  };
  assert.deepEqual(uploadUrlSchema.parse({ ...input, entity_id: "another-child" }), input);
});

test("document confirmation validates file size and date format", () => {
  const input = {
    document_type: "iep",
    file_name: "plan.pdf",
    file_url: "students/child/plan.pdf",
    file_size: 1,
    mime_type: "application/pdf",
    document_date: "2026-10-11",
  };
  assert.equal(confirmUploadSchema.safeParse(input).success, true);
  assert.equal(confirmUploadSchema.safeParse({ ...input, file_size: -1 }).success, false);
  assert.equal(
    confirmUploadSchema.safeParse({ ...input, document_date: "10/11/2026" }).success,
    false,
  );
});
