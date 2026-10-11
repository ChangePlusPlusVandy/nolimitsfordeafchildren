import { expect, test } from "@playwright/test";

import { signInAsAdmin } from "./fixtures";

/**
 * Authenticated client navigation (requires seeded admin:
 * `pnpm --filter nolimits-app db:seed`).
 *
 * Guards the dev client module graph: lazily loaded routes must not pull
 * raw CJS transitives (e.g. `prop-types` default import) that crash
 * hydration on navigation while direct loads work.
 */
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
