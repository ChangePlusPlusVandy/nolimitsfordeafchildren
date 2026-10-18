import { expect, test } from "@playwright/test";

import { signIn, signInAsAdmin } from "./fixtures";

/**
 * Admin schedule detail.
 * Requires `pnpm --filter nolimits-app db:seed` (teacher@nolimits.test,
 * Main Education Center 09:00–10:00 with Mia Chen and Leo Nguyen, and a
 * same-day Harbor Pop-Up slot at 10:30–11:30).
 */
test.describe("schedules", () => {
  test.describe.configure({ timeout: 120_000 });

  test("admin edits a schedule and a teacher is blocked from the page", async ({
    page,
    browser,
  }) => {
    await signInAsAdmin(page);
    await page.goto("/teachers");
    await expect(page.getByRole("heading", { name: "Teachers" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("row", { name: /teacher@nolimits\.test/i }).click();
    await expect(page.getByRole("link", { name: "Open schedule" }).first()).toBeVisible({
      timeout: 30_000,
    });

    const centerSchedule = page.getByRole("listitem").filter({ hasText: "Main Education Center" });
    await centerSchedule.getByRole("link", { name: "Open schedule" }).click();

    await expect(page).toHaveURL(/\/schedules\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Schedule", exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Mia Chen")).toBeVisible();
    await expect(page.getByText("Leo Nguyen")).toBeVisible();
    await expect(page.getByText("Main Education Center").first()).toBeVisible();

    await page.getByLabel("End time").fill("10:15");
    await page.getByRole("button", { name: "Save schedule" }).click();
    await expect(page.getByText(/Saved times: 9:00\s*AM\s*-\s*10:15\s*AM/)).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel("End time").fill("11:00");
    await page.getByRole("button", { name: "Save schedule" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /conflicts with existing schedules/i }),
    ).toBeVisible();
    await expect(page.getByText(/Saved times: 9:00\s*AM\s*-\s*10:15\s*AM/)).toBeVisible();

    await page.getByRole("button", { name: "End enrollment for Leo Nguyen" }).click();
    await page.getByRole("button", { name: "End enrollment", exact: true }).click();
    await expect(page.getByRole("button", { name: "Re-enroll Leo Nguyen" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: "End enrollment for Leo Nguyen" })).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: "Re-enroll Leo Nguyen" }).click();
    await expect(page.getByText("Student re-enrolled")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "End enrollment for Leo Nguyen" })).toBeVisible();

    const scheduleUrl = page.url();
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    try {
      await signIn(teacherPage, "teacher");
      await teacherPage.goto(scheduleUrl);
      await expect(teacherPage).toHaveURL(/\/my-day/, { timeout: 30_000 });
      await expect(teacherPage.getByRole("heading", { name: "Schedule", exact: true })).toHaveCount(
        0,
      );
    } finally {
      await teacherContext.close();
    }
  });
});
