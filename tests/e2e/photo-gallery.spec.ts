import path from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { signIn } from "./fixtures";

const PHOTO_FIXTURE = path.join(__dirname, "fixtures", "photo.png");
const MIA_CHEN = "Mia Chen (MC)";

function todayInOrgTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Teacher My Day upload. Signs in unless this page is already on My Day, so a
 * second caption in the same session does not bounce off /login.
 */
async function uploadSessionPhoto(
  page: Page,
  caption: string,
  options?: { studentLabel?: string },
): Promise<void> {
  if (!page.url().includes("/my-day")) {
    await signIn(page, "teacher");
  }
  await expect(page.getByRole("heading", { name: "Session Photos" })).toBeVisible({
    timeout: 30_000,
  });

  const sessionPhotos = page
    .locator(".MuiPaper-root")
    .filter({ has: page.getByRole("heading", { name: "Session Photos" }) });
  // MUI Select does not expose the InputLabel as the combobox accessible name.
  await sessionPhotos.getByRole("combobox").first().click();
  await expect(page.getByRole("option", { name: "Main Education Center" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("option", { name: "Main Education Center" }).click();

  if (options?.studentLabel) {
    const studentLabel = options.studentLabel;
    // Sessions load after the location list. Reopen the menu until Mia is present.
    await expect(async () => {
      await sessionPhotos.getByRole("combobox").nth(1).click();
      await expect(page.getByRole("option", { name: studentLabel })).toBeVisible({
        timeout: 1_000,
      });
    }).toPass({ timeout: 30_000 });
    await page.getByRole("option", { name: studentLabel }).click();
  }

  await page.getByLabel("Caption (optional)").fill(caption);
  const fileInput = sessionPhotos.locator('input[type="file"]');
  // A second upload of the same path does not fire change unless the input is cleared.
  await fileInput.evaluate((input) => {
    (input as HTMLInputElement).value = "";
  });
  await fileInput.setInputFiles(PHOTO_FIXTURE);
  await expect(sessionPhotos.getByText("photo.png")).toBeVisible();
  await page.getByRole("button", { name: "Upload Photo" }).click();
  await expect(page.getByText(caption)).toBeVisible({ timeout: 30_000 });
}

async function openAdminPhoto(page: Page, caption: string): Promise<Locator> {
  await signIn(page, "admin");
  await page.goto("/admin/photo-gallery");
  await expect(page.getByRole("heading", { name: "Photo Gallery" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel("Filter by session date").fill(todayInOrgTimezone());

  const card = page.locator(".MuiPaper-root").filter({ hasText: caption });
  await expect(card).toBeVisible({ timeout: 30_000 });
  return card;
}

async function confirmDelete(page: Page, card: Locator): Promise<void> {
  await card.getByRole("button", { name: "Delete photo.png" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Photo deleted")).toBeVisible();
}

/** Parent lands on /my-students; child cards show initials, the detail page shows the name. */
async function openMiaChen(page: Page): Promise<void> {
  await signIn(page, "parent");
  await page.getByText("MC", { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Mia Chen" })).toBeVisible({ timeout: 30_000 });
}

function childPhotoGallery(page: Page): Locator {
  return page
    .locator(".MuiPaper-root")
    .filter({ has: page.getByRole("heading", { name: "Photo Gallery" }) });
}

test.describe("photo gallery", () => {
  test("uploads a photo then an admin deletes it", async ({ browser }) => {
    test.setTimeout(180_000);
    const caption = `e2e-delete-${Date.now()}`;
    const teacherContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      await uploadSessionPhoto(teacherPage, caption);

      const card = await openAdminPhoto(adminPage, caption);
      await confirmDelete(adminPage, card);

      await expect(adminPage).toHaveURL(/\/admin\/photo-gallery/);
      await expect(adminPage.getByText(caption)).toHaveCount(0);

      await teacherPage.reload();
      await expect(teacherPage.getByRole("heading", { name: "Session Photos" })).toBeVisible({
        timeout: 30_000,
      });
      await expect(teacherPage.getByText(caption)).toHaveCount(0);
    } finally {
      await teacherContext.close();
      await adminContext.close();
    }
  });

  test("canceling delete keeps the photo", async ({ browser }) => {
    test.setTimeout(180_000);
    const caption = `e2e-cancel-${Date.now()}`;
    const teacherContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      await uploadSessionPhoto(teacherPage, caption);

      const card = await openAdminPhoto(adminPage, caption);
      await card.getByRole("button", { name: "Delete photo.png" }).click();
      const dialog = adminPage.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: "Delete photo?" })).toBeVisible();
      await dialog.getByRole("button", { name: "Cancel" }).click();

      await expect(dialog).toBeHidden();
      await expect(adminPage.getByText(caption)).toBeVisible();
      await expect(adminPage.getByText("Photo deleted")).toHaveCount(0);
    } finally {
      await teacherContext.close();
      await adminContext.close();
    }
  });

  test("teacher and parent views hide delete controls", async ({ browser }) => {
    test.setTimeout(180_000);
    const caption = `e2e-hidden-${Date.now()}`;
    const teacherContext = await browser.newContext();
    const parentContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    const parentPage = await parentContext.newPage();

    try {
      await uploadSessionPhoto(teacherPage, caption, { studentLabel: MIA_CHEN });
      await expect(teacherPage.getByRole("button", { name: "Delete photo.png" })).toHaveCount(0);

      await openMiaChen(parentPage);
      const gallery = childPhotoGallery(parentPage);
      await expect(gallery.getByText(caption)).toBeVisible({ timeout: 30_000 });
      await expect(gallery.getByRole("button", { name: /delete/i })).toHaveCount(0);
    } finally {
      await teacherContext.close();
      await parentContext.close();
    }
  });

  test("parent view drops the photo after an admin deletes it", async ({ browser }) => {
    test.setTimeout(180_000);
    const caption = `e2e-parent-${Date.now()}`;
    const teacherContext = await browser.newContext();
    const parentContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    const parentPage = await parentContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      await uploadSessionPhoto(teacherPage, caption, { studentLabel: MIA_CHEN });

      await openMiaChen(parentPage);
      await expect(childPhotoGallery(parentPage).getByText(caption)).toBeVisible({
        timeout: 30_000,
      });

      const card = await openAdminPhoto(adminPage, caption);
      await confirmDelete(adminPage, card);

      await parentPage.reload();
      await expect(parentPage.getByRole("heading", { name: "Mia Chen" })).toBeVisible({
        timeout: 30_000,
      });
      await expect(parentPage.getByText(caption)).toHaveCount(0);
    } finally {
      await teacherContext.close();
      await parentContext.close();
      await adminContext.close();
    }
  });

  test("deleting one photo leaves the other caption", async ({ browser }) => {
    test.setTimeout(180_000);
    const keepCaption = `e2e-keep-${Date.now()}`;
    const dropCaption = `e2e-drop-${Date.now()}`;
    const teacherContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    const adminPage = await adminContext.newPage();

    try {
      await uploadSessionPhoto(teacherPage, keepCaption);
      await uploadSessionPhoto(teacherPage, dropCaption);

      const card = await openAdminPhoto(adminPage, dropCaption);
      await confirmDelete(adminPage, card);

      await expect(adminPage.getByText(keepCaption)).toBeVisible();
      await expect(adminPage.getByText(dropCaption)).toHaveCount(0);

      await teacherPage.reload();
      await expect(teacherPage.getByRole("heading", { name: "Session Photos" })).toBeVisible({
        timeout: 30_000,
      });
      await expect(teacherPage.getByText(keepCaption)).toBeVisible();
      await expect(teacherPage.getByText(dropCaption)).toHaveCount(0);
    } finally {
      await teacherContext.close();
      await adminContext.close();
    }
  });
});
