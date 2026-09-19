import { test } from "@playwright/test";

/**
 * Users (admin user management).
 * Pages: /users, /users/[id]
 * TODO: admin session + seeded users.
 */
test.describe("users", () => {
  test.skip("list shows users for admin", async () => {
    // TODO: admin → /users → expect rows + role filter.
  });

  test.skip("detail shows user + role actions", async () => {
    // TODO: admin → /users/:id → approve/assign role.
  });

  test.skip("non-admin is blocked", async () => {
    // TODO: teacher/parent → /users → expect forbidden/redirect.
  });
});
