import { expect, test } from "@playwright/test";

import { signIn } from "./fixtures";

test("parent can remove, replace, and clear custom hearing devices", async ({ page, browser }) => {
  test.setTimeout(90_000);
  await signIn(page, "admin");
  await page.goto("/students");
  await page.getByRole("button", { name: "Add Student", exact: true }).click();
  const createDialog = page.getByRole("dialog");
  await createDialog.getByRole("textbox", { name: "First Name", exact: true }).fill("Hearing");
  await createDialog.getByRole("textbox", { name: "Last Name", exact: true }).fill("Regression");
  await createDialog.getByLabel("Date of Birth").fill("2020-01-15");
  await createDialog.getByRole("combobox").first().click();
  await page
    .getByRole("option", { name: "Main Education Center (education center)", exact: true })
    .click();
  await createDialog.getByRole("combobox").nth(2).click();
  await page.getByRole("option", { name: "Hearing Aid", exact: true }).click();
  await page.getByRole("option", { name: "Other", exact: true }).click();
  await page.keyboard.press("Escape");
  await createDialog.getByLabel("Other Hearing Device", { exact: true }).fill("Bonebridge");
  await createDialog.getByRole("button", { name: "Create Student", exact: true }).click();
  await expect(page).toHaveURL(/\/students\/[^/]+$/);
  const studentUrl = page.url();
  const studentId = new URL(studentUrl).pathname.split("/").pop();
  const parentContext = await browser.newContext();

  try {
    await page.getByRole("button", { name: "Link Parent", exact: true }).click();
    const linkDialog = page.getByRole("dialog");
    await linkDialog.getByRole("combobox", { name: "Search Parents" }).fill("parent");
    await page.getByRole("option", { name: "parent parent@nolimits.test", exact: true }).click();
    await linkDialog.getByRole("button", { name: "Link Parent", exact: true }).click();
    await expect(linkDialog.getByText("Currently Linked Parents (1)")).toBeVisible();
    await linkDialog.getByRole("button", { name: "Done", exact: true }).click();

    const parentPage = await parentContext.newPage();
    await signIn(parentPage, "parent");
    await parentPage.goto(`/parents/children/${studentId}`);
    await expect(
      parentPage.getByText("Devices: Hearing Aid, Bonebridge", { exact: true }),
    ).toBeVisible();
    await parentPage.getByRole("button", { name: "Edit Hearing Info", exact: true }).click();
    const dialog = parentPage.getByRole("dialog");
    const devices = dialog.getByRole("combobox").first();

    // Removing the final device must retain the standard device alongside it.
    await devices.focus();
    await devices.press("Backspace");
    await devices.press("Escape");
    await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(dialog).toBeHidden();
    await parentPage.reload();
    await expect(parentPage.getByText("Devices: Hearing Aid", { exact: true })).toBeVisible();

    await parentPage.getByRole("button", { name: "Edit Hearing Info", exact: true }).click();
    await devices.fill("Bonebridge 2");
    await devices.press("Enter");
    await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(dialog).toBeHidden();
    await parentPage.reload();
    await expect(
      parentPage.getByText("Devices: Hearing Aid, Bonebridge 2", { exact: true }),
    ).toBeVisible();

    await parentPage.getByRole("button", { name: "Edit Hearing Info", exact: true }).click();
    await devices.focus();
    await devices.press("Backspace");
    await devices.press("Backspace");
    await devices.press("Escape");
    await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(dialog).toBeHidden();
    await parentPage.reload();
    await expect(parentPage.getByText("Devices: Not specified", { exact: true })).toBeVisible();
  } finally {
    await parentContext.close();
    await page.goto(`${studentUrl}/edit`);
    await page.getByRole("switch", { name: "Active", exact: true }).uncheck();
    await page.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(page).toHaveURL(studentUrl);
  }
});
