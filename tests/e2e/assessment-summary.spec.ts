import { expect, test } from "@playwright/test";

import { signIn } from "./fixtures";

test("assessment summary clears on edit and clone while Add Post preserves the cycle", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const cycleDate = "2030-01-07";
  const summary = `Assessment summary ${Date.now()}`;
  const goal = "Summary regression goal";
  await signIn(page, "teacher");
  await page.getByText("MC", { exact: true }).first().click();
  await expect(page).toHaveURL(/\/teachers\/students\/[^/]+$/);
  const cycleRow = page.getByRole("row").filter({ hasText: "Jan 7, 2030" });
  const dialog = page.getByRole("dialog");
  try {
    await page.getByRole("button", { name: "Add Assessment", exact: true }).click();
    await dialog.getByLabel("Cycle Start Date", { exact: true }).fill(cycleDate);
    await dialog.getByLabel("Goal 1", { exact: true }).fill(goal);
    await dialog.getByLabel("Summary (optional)", { exact: true }).fill(summary);
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
    await cycleRow.getByRole("button", { name: "Expand cycle details" }).click();
    await expect(page.getByText(`Summary: ${summary}`, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add Post-Assessment", exact: true }).click();
    await expect(dialog.getByLabel("Cycle Start Date", { exact: true })).toHaveValue(cycleDate);
    await expect(
      dialog.getByRole("combobox", { name: "Assessment Type", exact: true }),
    ).toContainText("Post-Assessment");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Edit pre-assessment", exact: true }).click();
    await dialog.getByLabel("Summary (optional)", { exact: true }).fill("");
    await dialog.getByRole("button", { name: "Update", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(`Summary: ${summary}`, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Edit pre-assessment", exact: true }).click();
    await expect(dialog.getByLabel("Summary (optional)", { exact: true })).toHaveValue("");
    await dialog.getByLabel("Summary (optional)", { exact: true }).fill(summary);
    await dialog.getByRole("button", { name: "Update", exact: true }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Clone pre-assessment", exact: true }).click();
    await expect(dialog.getByLabel("Summary (optional)", { exact: true })).toHaveValue(summary);
    await expect(dialog.getByLabel("Goal 1", { exact: true })).toHaveValue(goal);
    await dialog.getByLabel("Summary (optional)", { exact: true }).fill("");
    await dialog.getByRole("button", { name: "Clone", exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "Edit post-assessment", exact: true }).click();
    await expect(dialog.getByLabel("Summary (optional)", { exact: true })).toHaveValue("");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  } finally {
    if (await dialog.isVisible()) {
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(dialog).toBeHidden();
    }
    for (const type of ["post", "pre"]) {
      const remove = page.getByRole("button", { name: `Delete ${type}-assessment`, exact: true });
      if (await remove.isVisible()) {
        await remove.click();
        await dialog.getByRole("button", { name: "Delete", exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(remove).toHaveCount(0);
      }
    }
  }
});
