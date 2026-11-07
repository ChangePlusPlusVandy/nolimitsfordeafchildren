import { expect, type Page, test } from "@playwright/test";

/**
 * Password-reset smoke suite.
 *
 * Tests the public forgot-password and reset-password pages.
 * The happy-path email delivery depends on an email provider being configured
 * (see issue #21); these tests cover the UI surface and token-validation path.
 */

async function gotoHydrated(page: Page, path: string): Promise<void> {
  const session = page.waitForResponse(
    (response) => response.url().includes("/api/auth/get-session"),
    { timeout: 30_000 },
  );
  await page.goto(path);
  await session;
}

test.describe("forgot-password", () => {
  test("renders the forgot-password form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
  });

  test("shows success state after submitting any email (no enumeration)", async ({ page }) => {
    await gotoHydrated(page, "/forgot-password");
    await page.getByLabel(/email/i).fill("doesnotexist@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    // better-auth always returns 200 to prevent user enumeration; we expect
    // a success message OR an admin-guidance error (email not configured).
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /check your inbox|email delivery is not configured/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("has a back-to-sign-in link", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("reset-password", () => {
  test("shows an error for a missing token", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(
      page.getByText(/no reset token found|use the link from your reset email/i),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /request reset link/i })).toBeVisible();
  });

  test("shows an error for an invalid token", async ({ page }) => {
    // The requestPasswordResetCallback endpoint redirects to callbackURL?error=INVALID_TOKEN
    // when the token doesn't exist in the verification store.
    await page.goto("/reset-password?error=INVALID_TOKEN");
    await expect(page.getByText(/invalid or has already been used/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /request new link/i })).toBeVisible();
  });

  test("rejects passwords that do not match", async ({ page }) => {
    // Use a plausible-looking but fake token to reach the form.
    await gotoHydrated(page, "/reset-password?token=fakesmoketoken123");
    await page
      .getByLabel(/new password/i)
      .first()
      .fill("GoodPassword1!");
    await page.getByLabel(/confirm new password/i).fill("DifferentPassword2!");
    await page.getByRole("button", { name: /set new password/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("login forgot-password link", () => {
  test("login page has a forgot-password link", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
