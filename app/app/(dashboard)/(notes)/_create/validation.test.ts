import assert from "node:assert/strict";
import test from "node:test";

import { createNoteSchema } from "./validation";

test("session notes retain optional schedule and session date fields", () => {
  const input = {
    note: "Progress",
    schedule_id: "schedule-1",
    session_date: "2026-10-11",
    extra: "kept",
  };
  assert.deepEqual(createNoteSchema.parse(input), input);
  assert.deepEqual(createNoteSchema.parse({ note: " " }), { note: " " });
});

test("session note validation retains length and date format limits", () => {
  assert.equal(createNoteSchema.safeParse({ note: "" }).success, false);
  assert.equal(createNoteSchema.safeParse({ note: "x".repeat(5000) }).success, true);
  assert.equal(createNoteSchema.safeParse({ note: "x".repeat(5001) }).success, false);
  assert.equal(
    createNoteSchema.safeParse({ note: "Progress", session_date: "10/11/2026" }).success,
    false,
  );
});
