import { expect, test } from "@playwright/test";

/**
 * Login smoke — the only non-skipped suite in the scaffold.
 * Covers the public auth surface without needing seeded users:
 * rendering, validation, bad-credentials error, and middleware redirects.
 */
test.describe("login smoke", () => {
  test("renders the sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i }).first()).toBeVisible();
  });

  test("unauthenticated dashboard visit redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nobody@example.com");
    await page.getByLabel(/^password/i).fill("wrong-password-123");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    // better-auth returns an error alert; assert *some* error surfaces
    // without pinning the exact copy (copy changes often).
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  });

  test("can switch to signup mode", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign up/i }).click();
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
  });
});
