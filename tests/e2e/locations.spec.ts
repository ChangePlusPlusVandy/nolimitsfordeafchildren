import { test } from "@playwright/test";

/**
 * Locations (education_center / pop_up / remote).
 * Pages: /locations, /locations/new,
 *        /locations/[siteId], /locations/[siteId]/edit
 * TODO: seed locations + admin session, then unskip.
 */
test.describe("locations", () => {
  test.skip("list shows education sites", async () => {
    // TODO: admin → /locations → expect site rows.
  });

  test.skip("admin can open the new-location form", async () => {
    // TODO: admin → /locations/new → expect form fields.
  });

  test.skip("detail shows a single site", async () => {
    // TODO: seed siteId → /locations/:siteId → expect header + students.
  });

  test.skip("edit updates a site", async () => {
    // TODO: admin → /locations/:siteId/edit → change name → save → expect toast/redirect.
  });

  test.skip("non-admin cannot access new/edit", async () => {
    // TODO: teacher/parent → /locations/new → expect forbidden/redirect.
  });
});
