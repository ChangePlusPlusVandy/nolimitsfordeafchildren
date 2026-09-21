import { test } from "@playwright/test";

/**
 * Parent flows.
 * Pages: /parents/schedule-change, /parents/my-requests,
 *        /parents/directory, /parents/children/[studentId]
 * TODO: parent session linked to seeded children.
 */
test.describe("parents", () => {
  test.skip("schedule-change browser (new job flow)", async () => {
    // TODO: parent → /parents/schedule-change → browse slots → request.
  });

  test.skip("my-requests shows make-up + schedule-change status", async () => {
    // TODO: parent → /parents/my-requests → expect pending/approved rows.
  });

  test.skip("directory shows families (scoped)", async () => {
    // TODO: parent → /parents/directory → expect scoped entries.
  });

  test.skip("child detail shows schedule + progress", async () => {
    // TODO: parent → /parents/children/:studentId → expect attendance + scores.
  });
});
