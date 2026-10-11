import assert from "node:assert/strict";
import { test } from "node:test";

import { summarizeParticipation } from "./summary";

const participant = {
  sibling_id: "sibling-a",
  sibling_name: "Alex",
  student_id: "student-a",
  student_initials: "AB",
  site_id: "site-a",
  site_name: "East",
};

test("empty participation produces an empty report", () => {
  assert.deepEqual(summarizeParticipation([]), { items: [], total: 0 });
});

test("late sessions count as present while absences count only toward total sessions", () => {
  assert.deepEqual(
    summarizeParticipation([
      { ...participant, status: "present" },
      { ...participant, status: "late" },
      { ...participant, status: "no_show" },
      { ...participant, status: "cancelled" },
    ]),
    { items: [{ ...participant, total_sessions: 4, present_sessions: 2 }], total: 1 },
  );
});

test("reports separate students and sites and sort by site, initials, then sibling name", () => {
  const rows = [
    { ...participant, site_id: "site-b", site_name: "West", status: "present" as const },
    { ...participant, sibling_id: "sibling-b", sibling_name: "Zoe", status: "late" as const },
    { ...participant, student_id: "student-b", student_initials: "CD", status: "no_show" as const },
    { ...participant, status: "present" as const },
  ];
  const result = summarizeParticipation(rows);

  assert.equal(result.total, 4);
  assert.deepEqual(
    result.items.map(({ sibling_name, student_initials, site_name }) => [
      site_name,
      student_initials,
      sibling_name,
    ]),
    [
      ["East", "AB", "Alex"],
      ["East", "AB", "Zoe"],
      ["East", "CD", "Alex"],
      ["West", "AB", "Alex"],
    ],
  );
});
