import assert from "node:assert/strict";
import test from "node:test";

import { confirmUploadSchema, uploadUrlSchema } from "./validation";

const upload = {
  entity_type: "student",
  entity_id: "student-id",
  document_type: "audiogram",
  file_name: "hearing-test.pdf",
  content_type: "application/pdf",
};

test("upload validation preserves supported entities and document types", () => {
  for (const entity_type of ["student", "teacher"]) {
    for (const document_type of [
      "audiogram",
      "iep",
      "cv",
      "annual_test_result",
      "pre_report",
      "graduation_speech",
      "other",
    ]) {
      const input = { ...upload, entity_type, document_type, extra: "retained" };
      assert.deepEqual(uploadUrlSchema.parse(input), input);
    }
  }
});

test("confirmation accepts nullable dates without requiring content type", () => {
  const { content_type: _contentType, ...record } = upload;
  const input = {
    ...record,
    file_url: "/api/files/documents/test.pdf",
    file_size: 0,
    document_date: null,
    session_date: "2026-10-11",
    session_type: null,
    extra: "retained",
  };

  assert.deepEqual(confirmUploadSchema.parse(input), input);
  assert.equal(
    confirmUploadSchema.safeParse({ ...input, session_date: "10/11/2026" }).success,
    false,
  );
  assert.equal(confirmUploadSchema.safeParse({ ...input, file_size: -1 }).success, false);
});

test("upload target validation requires the entity and content type", () => {
  assert.equal(uploadUrlSchema.safeParse({ ...upload, entity_id: "" }).success, false);
  assert.equal(uploadUrlSchema.safeParse({ ...upload, content_type: "" }).success, false);
  assert.equal(uploadUrlSchema.safeParse({ ...upload, entity_type: "parent" }).success, false);
});
