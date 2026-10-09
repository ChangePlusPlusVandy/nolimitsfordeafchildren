import { expect, type Page, test } from "@playwright/test";

/**
 * Authenticated client navigation (requires seeded admin:
 * `pnpm --filter nolimits-app db:seed`).
 *
 * Guards the dev client module graph: lazily loaded routes must not pull
 * raw CJS transitives (e.g. `prop-types` default import) that crash
 * hydration on navigation while direct loads work.
 */
async function signInAsAdmin(page: Page): Promise<void> {
  const session = page.waitForResponse(
    (response) => response.url().includes("/api/auth/get-session"),
    { timeout: 30_000 },
  );
  await page.goto("/login");
  await session;
  await page.getByLabel(/email/i).fill("admin@nolimits.test");
  await page.getByLabel(/^password/i).fill("NoLimits!2026");
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeEnabled();
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/users/, { timeout: 30_000 });
}

test.describe("authenticated navigation", () => {
  test("admin goes users -> students -> users plus reload without module errors", async ({
    page,
  }) => {
    const moduleErrors: Array<string> = [];
    page.on("pageerror", (error) => moduleErrors.push(`PAGEERROR: ${error.message.slice(0, 300)}`));
    page.on("console", (message) => {
      if (message.type() === "error" && message.text().includes("does not provide an export")) {
        moduleErrors.push(`CONSOLE: ${message.text().slice(0, 300)}`);
      }
    });

    await signInAsAdmin(page);
    await expect(page.getByRole("heading", { name: /manage users/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("link", { name: /^students$/i }).click();
    await expect(page.getByRole("heading", { name: /^students$/i }).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("link", { name: /^users$/i }).click();
    await expect(page.getByRole("heading", { name: /manage users/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.reload();
    await expect(page.getByRole("heading", { name: /manage users/i })).toBeVisible({
      timeout: 30_000,
    });

    expect(moduleErrors).toEqual([]);
  });
});
