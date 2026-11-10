import { expect, test } from "@playwright/test";

import { signIn } from "./fixtures";

test("linked parent manages siblings and opens hearing information", async ({ page }) => {
  test.setTimeout(60_000);
  const name = `Family test ${Date.now()}`;
  const editedName = `${name} edited`;
  await signIn(page, "parent");
  await page.getByText("MC", { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Mia Chen", exact: true })).toBeVisible();
  try {
    await page.getByRole("button", { name: "Add Sibling", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Name", exact: true }).fill(name);
    await dialog.getByLabel("Age", { exact: true }).fill("6");
    await dialog.getByRole("button", { name: "Add Sibling", exact: true }).click();
    await expect(
      page.getByRole("button", { name: `Edit sibling ${name}`, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: `Edit sibling ${name}`, exact: true }).click();
    await dialog.getByRole("textbox", { name: "Name", exact: true }).fill(editedName);
    await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(
      page.getByRole("button", { name: `Edit sibling ${editedName}`, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: `Edit sibling ${editedName}`, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Edit Hearing Info", exact: true }).click();
    await expect(dialog.getByRole("heading", { name: "Edit Hearing Information" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  } finally {
    const dialog = page.getByRole("dialog");
    if (await dialog.isVisible()) {
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toBeHidden();
    }
    for (const siblingName of [name, editedName]) {
      const remove = page.getByRole("button", {
        name: `Remove sibling ${siblingName}`,
        exact: true,
      });
      if (await remove.isVisible()) {
        await remove.click();
        await dialog.getByRole("button", { name: "Remove", exact: true }).click();
        await expect(remove).toHaveCount(0);
      }
    }
  }
});
