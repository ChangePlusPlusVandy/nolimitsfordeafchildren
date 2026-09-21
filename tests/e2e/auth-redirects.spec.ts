import { test } from "@playwright/test";

/**
 * Auth redirects + role homes.
 * Middleware (app/middleware.ts) only checks cookie presence; role gates
 * live server-side (requireRole) + client AuthProvider. These need seeded
 * sessions per role — stubbed until fixtures exist.
 *
 * TODO: add fixtures/admin.ts, fixtures/teacher.ts, fixtures/parent.ts
 * (storageState per role) then unskip.
 */
test.describe("auth redirects", () => {
  test.skip("pending-approval renders for unassigned role", async () => {
    // TODO: sign in as unassigned user, expect /pending-approval content.
  });

  test.skip("administrator lands on /users", async () => {
    // TODO: admin storageState → goto / → expectURL /users.
  });

  test.skip("teacher lands on /my-day", async () => {
    // TODO: teacher storageState → goto / → expectURL /my-day.
  });

  test.skip("parent lands on /my-students", async () => {
    // TODO: parent storageState → goto / → expectURL /my-students.
  });

  test.skip("signed-in user visiting /login is bounced to /", async () => {
    // TODO: any authed storageState → goto /login → expectURL /.
  });
});
