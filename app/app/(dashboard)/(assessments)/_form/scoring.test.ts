import assert from "node:assert/strict";
import test from "node:test";

import { summarizeFocuses, validateFocuses } from "./scoring";

test("missing focuses keep the legacy general assessment defaults", () => {
  assert.deepEqual(validateFocuses(), []);
  assert.deepEqual(validateFocuses([]), []);
  assert.deepEqual(summarizeFocuses([]), { teaching_focus: "General", score: 0 });
});

test("focus totals are weighted and rounded to the legacy twenty-point scale", () => {
  const focuses = [
    { goal: " Speech ", score: 2, max_score: 3 },
    { goal: "Listening", score: 1, max_score: 4 },
  ];
  assert.equal(validateFocuses(focuses), focuses);
  assert.deepEqual(summarizeFocuses(focuses), { teaching_focus: "Speech | Listening", score: 9 });
  assert.equal(focuses[0].goal, " Speech ");
});

test("focus validation preserves limits and error messages", () => {
  const focus = { goal: "Speech", score: 1, max_score: 2 };
  assert.throws(() => validateFocuses(Array.from({ length: 5 }, () => ({ ...focus }))), {
    message: "Assessment can include up to 4 teaching focuses",
  });
  assert.throws(() => validateFocuses([{ ...focus, goal: " " }]), {
    message: "Each teaching focus must include a goal",
  });
  assert.throws(() => validateFocuses([{ ...focus, max_score: 0 }]), {
    message: "Each teaching focus max score must be greater than 0",
  });
  for (const score of [-1, 3]) {
    assert.throws(() => validateFocuses([{ ...focus, score }]), {
      message: "Each teaching focus score must be between 0 and max score",
    });
  }
  assert.equal(validateFocuses(Array.from({ length: 4 }, () => ({ ...focus }))).length, 4);
});

test("legacy score aggregation retains clamping and zero-total behavior", () => {
  assert.equal(summarizeFocuses([{ goal: "A", score: 3, max_score: 2 }]).score, 20);
  assert.equal(summarizeFocuses([{ goal: "A", score: -1, max_score: 2 }]).score, 0);
  assert.equal(summarizeFocuses([{ goal: "A", score: 1, max_score: 0 }]).score, 0);
});
