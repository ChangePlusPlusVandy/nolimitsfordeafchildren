import { test } from "@playwright/test";

/**
 * Daily work surfaces: /my-day, /my-students, /my-profile,
 * /bulletin, /chat, /pending-approval.
 * TODO: role sessions + seeded sessions/assessments.
 */
test.describe("daily work", () => {
  test.skip("my-day shows teacher sessions + attendance marking", async () => {
    // TODO: teacher → /my-day → mark present/no-show/cancelled + note.
  });

  test.skip("my-students shows assigned students", async () => {
    // TODO: teacher/parent → /my-students → expect scoped list.
  });

  test.skip("my-profile renders + updates", async () => {
    // TODO: any role → /my-profile → edit name → save.
  });

  test.skip("bulletin board renders posts", async () => {
    // TODO: any role → /bulletin → expect approved posts.
  });

  test.skip("chat renders threads", async () => {
    // TODO: any role → /chat → expect threads + send.
  });

  test.skip("pending-approval guidance for unassigned", async () => {
    // TODO: unassigned → /pending-approval → expect instructions.
  });
});
