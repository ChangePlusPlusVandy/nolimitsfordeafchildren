import { test } from "@playwright/test";

/**
 * Admin review queues.
 * Pages: /admin/sessions, /admin/makeup-requests,
 *        /admin/schedule-change-requests, /admin/document-reviews,
 *        /admin/bulletin-moderation, /admin/photo-gallery,
 *        /admin/parent-zip-report, /admin/sibling-participation-report
 * TODO: admin session + seeded requests/documents.
 */
test.describe("admin queues", () => {
  test.skip("sessions queue", async () => {
    // TODO: admin → /admin/sessions → expect attendance alerts.
  });

  test.skip("approves a makeup request", async () => {
    // TODO: seed pending make-up → /admin/makeup-requests → approve.
  });

  test.skip("approves a schedule-change request", async () => {
    // TODO: seed request → /admin/schedule-change-requests → approve.
  });

  test.skip("reviews audiogram/IEP documents", async () => {
    // TODO: seed doc → /admin/document-reviews → approve/reject.
  });

  test.skip("moderates bulletin posts", async () => {
    // TODO: seed post → /admin/bulletin-moderation → approve/hide.
  });

  test.skip("photo gallery moderation", async () => {
    // TODO: admin → /admin/photo-gallery → expect images + actions.
  });

  test.skip("parent zip report renders", async () => {
    // TODO: admin → /admin/parent-zip-report → expect export.
  });

  test.skip("sibling participation report renders", async () => {
    // TODO: admin → /admin/sibling-participation-report → expect rows.
  });
});
