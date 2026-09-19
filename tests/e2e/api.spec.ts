import { expect, test } from "@playwright/test";

/**
 * API route handlers (app/app/api/...).
 * Health is live; auth/files need sessions + R2 emulation.
 */
test.describe("api", () => {
  test("health returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    await expect(await res.json()).toEqual({ status: "ok" });
  });

  test.skip("auth handler rejects bad login (route-level)", async () => {
    // TODO: POST /api/auth/sign-in/email with bad creds → expect 4xx.
  });

  test.skip("files upload requires auth", async () => {
    // TODO: unauthenticated POST /api/files/upload → expect 401.
  });

  test.skip("files download requires auth + returns object", async () => {
    // TODO: authed GET /api/files/:key → expect 200 + bytes (R2 emulated).
  });
});
