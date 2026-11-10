import { expect, type Page, test } from "@playwright/test";

import { signIn, signInAsAdmin } from "./fixtures";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function timeLabel(value: string): RegExp {
  const [hours, minutes] = value.split(":").map(Number);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const suffix = hours < 12 ? "AM" : "PM";
  return new RegExp(`${hour12}:${String(minutes).padStart(2, "0")}\\s*${suffix}`);
}

function savedTimes(start: string, end: string): RegExp {
  return new RegExp(`Saved times: ${timeLabel(start).source}\\s*-\\s*${timeLabel(end).source}`);
}

async function openCenterSchedule(page: Page): Promise<void> {
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
}

async function ensureLeoEnrolled(page: Page): Promise<void> {
  const reenroll = page.getByRole("button", { name: "Re-enroll Leo Nguyen" });
  if (await reenroll.isVisible()) {
    await reenroll.click();
    await expect(page.getByRole("button", { name: "End enrollment for Leo Nguyen" })).toBeVisible({
      timeout: 30_000,
    });
  }
}

/**
 * Admin schedule detail.
 * Requires `pnpm --filter nolimits-app db:seed` (teacher@nolimits.test,
 * Main Education Center 09:00–10:00 with Mia Chen and Leo Nguyen, and a
 * same-day Harbor Pop-Up slot at 10:30–11:30). Restores the schedule's end
 * time and Leo's enrollment so reruns do not need a reseed.
 */
test.describe("schedules", () => {
  test.describe.configure({ timeout: 120_000 });

  test("admin edits a schedule and a teacher is blocked from the page", async ({
    page,
    browser,
  }) => {
    await signInAsAdmin(page);
    await openCenterSchedule(page);
    const scheduleUrl = page.url();

    const startTime = page.getByLabel("Start time");
    const endTime = page.getByLabel("End time");
    const originalStart = await startTime.inputValue();
    const originalEnd = await endTime.inputValue();
    const targetEnd = originalEnd === "10:15" ? "10:20" : "10:15";

    try {
      await ensureLeoEnrolled(page);
      await expect(page.getByText("Mia Chen")).toBeVisible();
      await expect(page.getByText("Leo Nguyen")).toBeVisible();
      await expect(page.getByText("Main Education Center").first()).toBeVisible();

      await endTime.fill(targetEnd);
      await page.getByRole("button", { name: "Save schedule" }).click();
      await expect(page.getByText(savedTimes(originalStart, targetEnd))).toBeVisible({
        timeout: 30_000,
      });

      await endTime.fill("11:00");
      await page.getByRole("button", { name: "Save schedule" }).click();
      const conflictAlert = page
        .getByRole("alert")
        .filter({ hasText: /conflicts with existing schedules/i });
      await expect(conflictAlert).toBeVisible();
      await expect(conflictAlert).toContainText(timeLabel("10:30"));
      await expect(conflictAlert).not.toContainText(UUID_RE);
      await expect(page.getByText(savedTimes(originalStart, targetEnd))).toBeVisible();

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
      await expect(
        page.getByRole("button", { name: "End enrollment for Leo Nguyen" }),
      ).toBeVisible();
    } finally {
      await page.goto(scheduleUrl);
      await expect(endTime).toBeVisible({ timeout: 30_000 });
      await ensureLeoEnrolled(page);
      if ((await endTime.inputValue()) !== originalEnd) {
        await endTime.fill(originalEnd);
        await page.getByRole("button", { name: "Save schedule" }).click();
        await expect(page.getByText(savedTimes(originalStart, originalEnd))).toBeVisible({
          timeout: 30_000,
        });
      }
    }

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
