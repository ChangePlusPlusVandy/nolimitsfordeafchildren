import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { eq } from "drizzle-orm";
import { getPlatformProxy } from "wrangler";

import { db, setDb } from "@/_platform/db";
import { DocumentTable, UserTable } from "@/_platform/db/schema";
import { ForbiddenError } from "@/_shared/server/errors";

import { assertCanViewDocumentFile } from "./service";

const userId = crypto.randomUUID();
let proxy: Awaited<ReturnType<typeof getPlatformProxy<{ DB: D1Database }>>>;

before(async () => {
  proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: "wrangler.jsonc",
    persist: true,
  });
  setDb(proxy.env.DB);
  await db
    .insert(UserTable)
    .values({ id: userId, email: `${userId}@nolimits.test`, name: "File test", role: "teacher" });
});

after(async () => {
  await db.delete(DocumentTable).where(eq(DocumentTable.uploaded_by, userId));
  await db.delete(UserTable).where(eq(UserTable.id, userId));
  await proxy.dispose();
});

for (const prefix of [
  "/api/files/",
  "https://nolimits-r2-staging.r2.dev/",
  "https://pub-nolimits-r2-staging.r2.dev/",
]) {
  for (const reviewStatus of ["approved", "pending", "rejected"] as const) {
    test(`parent approval check resolves ${prefix} ${reviewStatus} documents`, async () => {
      const key = `documents/student/${crypto.randomUUID()}/pre_report/report.pdf`;
      await db.insert(DocumentTable).values({
        entity_type: "student",
        entity_id: crypto.randomUUID(),
        document_type: "pre_report",
        file_url: `${prefix}${key}`,
        file_name: "report.pdf",
        review_status: reviewStatus,
        uploaded_by: userId,
      });

      const check = () => assertCanViewDocumentFile(`/api/files/${key}`, { role: "parent" });
      if (reviewStatus === "approved") {
        await assert.doesNotReject(check);
        return;
      }

      await assert.rejects(check, ForbiddenError);
    });
  }
}

test("parents cannot download a file without a document row", async () => {
  const url = `/api/files/documents/student/${crypto.randomUUID()}/other/unconfirmed.pdf`;
  await assert.rejects(() => assertCanViewDocumentFile(url, { role: "parent" }), ForbiddenError);
});
