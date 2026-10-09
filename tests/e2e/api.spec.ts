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

  test("files upload requires auth", async ({ request }) => {
    const res = await request.post("/api/files/upload?key=documents/student/x/doc.pdf", {
      multipart: {
        file: { name: "doc.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") },
      },
    });
    expect(res.status()).toBe(401);
    await expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    expect(res.headers()["x-auth-error-code"]).toBe("UNAUTHORIZED");
  });

  test("files download requires auth and stays private", async ({ request }) => {
    const res = await request.get("/api/files/documents/student/x/doc.pdf");
    expect(res.status()).toBe(401);
  });
});
