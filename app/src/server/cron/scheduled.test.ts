import assert from "node:assert/strict";
import { test } from "node:test";

import { getPlatformProxy } from "wrangler";

import { initD1, setDb } from "@/lib/db";

import { AUDIOGRAM_CRON, BIRTHDAY_CRON, type CronJobSummary, runScheduledJobs } from "./index.js";

/**
 * Scheduled dispatch against real local D1 (wrangler miniflare).
 * Needs migrated tables (`wrangler d1 migrations apply <db> --local`).
 * Email stays disabled locally, so jobs complete with numeric summaries
 * and never throw. Counts vary with seed data; only shape is asserted.
 */

function assertSummary(summary: CronJobSummary): void {
  for (const job of [summary.birthday, summary.audiogram]) {
    assert.equal(typeof job.sent, "number");
    assert.equal(typeof job.errors, "number");
  }
}

test("both configured crons dispatch against local D1", async () => {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: "wrangler.jsonc",
    persist: true,
  });
  try {
    // Mirror worker.ts scheduled(): inject binding, init D1, dispatch.
    setDb(proxy.env.DB);
    await initD1(proxy.env.DB);
    assertSummary(await runScheduledJobs(BIRTHDAY_CRON));
    assertSummary(await runScheduledJobs(AUDIOGRAM_CRON));
  } finally {
    await proxy.dispose();
  }
});
