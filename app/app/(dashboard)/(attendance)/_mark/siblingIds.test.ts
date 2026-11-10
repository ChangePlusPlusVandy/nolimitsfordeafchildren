import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeSiblingParticipantIds } from "./siblingIds";

test("missing sibling selections produce no participants", () => {
  assert.deepEqual(normalizeSiblingParticipantIds(), []);
  assert.deepEqual(normalizeSiblingParticipantIds([]), []);
});

test("sibling selections are trimmed, deduplicated, and kept in selection order", () => {
  const selections = [" sibling-b ", "", "sibling-a", "sibling-b", "  "];

  assert.deepEqual(normalizeSiblingParticipantIds(selections), ["sibling-b", "sibling-a"]);
  assert.deepEqual(selections, [" sibling-b ", "", "sibling-a", "sibling-b", "  "]);
});
