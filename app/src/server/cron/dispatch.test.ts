import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { AUDIOGRAM_CRON, BIRTHDAY_CRON, runScheduledJobs } from "./index.js";

/**
 * Cron dispatch (src/server/cron) + trigger wiring.
 * Unknown cron expressions must run nothing and touch no bindings;
 * known jobs without an injected D1 must fail loudly (the `scheduled`
 * handler in worker.ts injects via setDb first).
 */

test("unknown cron runs neither job without bindings", async () => {
  const summary = await runScheduledJobs("0 0 1 1 *");
  assert.deepEqual(summary, {
    birthday: { sent: 0, errors: 0 },
    audiogram: { sent: 0, errors: 0 },
  });
});

test("known cron without D1 binding fails loudly", async () => {
  await assert.rejects(() => runScheduledJobs(BIRTHDAY_CRON), /No D1 binding/);
});

test("cron constants match wrangler triggers", () => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const raw = readFileSync(join(dir, "wrangler.jsonc"), "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n")
    .replace(/,(\s*[}\]])/g, "$1");
  const config = JSON.parse(raw) as { triggers?: { crons?: string[] } };
  assert.ok(config.triggers?.crons?.includes(BIRTHDAY_CRON));
  assert.ok(config.triggers?.crons?.includes(AUDIOGRAM_CRON));
});
