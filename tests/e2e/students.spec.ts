import { test } from "@playwright/test";

/**
 * Students — PII-sensitive (lists show initials only).
 * Pages: /students, /students/[id], /students/[id]/edit
 * TODO: seed students per location + role sessions.
 */
test.describe("students", () => {
  test.skip("list shows initials only (PII guard)", async () => {
    // TODO: picks a role with access → /students → expect initials, no full names.
  });

  test.skip("detail shows full PII for authorized role", async () => {
    // TODO: admin/teacher → /students/:id → expect full profile.
  });

  test.skip("parent sees only linked children", async () => {
    // TODO: parent → /students → expect only own children.
  });

  test.skip("edit updates a student (admin)", async () => {
    // TODO: admin → /students/:id/edit → save → expect success.
  });
});
