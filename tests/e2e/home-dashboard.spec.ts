import { test } from "@playwright/test";

/**
 * Dashboard home (app/app/(dashboard)/page.tsx) — role-aware landing.
 * TODO: unskip per role once storageState fixtures exist.
 */
test.describe("dashboard home", () => {
  test.skip("renders for administrator", async () => {
    // TODO: admin → goto / → expect dashboard shell + nav.
  });

  test.skip("renders for teacher", async () => {
    // TODO: teacher → goto / → expect role home content.
  });

  test.skip("renders for parent", async () => {
    // TODO: parent → goto / → expect linked-children summary.
  });
});
