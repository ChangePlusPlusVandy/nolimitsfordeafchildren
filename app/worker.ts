/**
 * Cloudflare Worker entrypoint (wrangler.jsonc "main": "./worker.ts").
 *
 * Custom entry for the Vinext legacy-Wrangler setup: it composes the
 * Vinext fetch handler with a `scheduled` handler backed by Cron Triggers
 * (see `triggers.crons` in wrangler.jsonc). The `@cloudflare` Vite plugin
 * bundles this file as the Worker entry.
 *
 * Cloudflare reads lifecycle handlers off the default export, so
 * `scheduled` must live on it (a named export alone is not picked up).
 */
import handler from "vinext/server/fetch-handler";

import { initD1, setDb } from "./src/lib/db";
import { runScheduledJobs } from "./src/server/cron";

/**
 * Cron Triggers (UTC — see wrangler.jsonc for PT->UTC mapping):
 *  - "0 16 * * *"  daily 8:00 AM PT -> birthday notifications
 *  - "0 17 * * 1"  Monday 9:00 AM PT -> audiogram reminders
 */
export async function scheduled(event: ScheduledEvent, env: CloudflareEnv, ctx: ExecutionContext) {
  console.log("[Cron] scheduled event:", event.cron);

  // The jobs use the shared `db` from src/lib/db; give them the real binding
  // (request env is unavailable outside a request).
  setDb(env.DB);
  await initD1(env.DB);

  const summary = await runScheduledJobs(event.cron);
  console.log("[Cron] completed:", summary);

  // The fetch handler from vinext remains the default export's `fetch`;
  // this scheduled handler runs in the same Worker.
  void ctx;
}

const worker = {
  ...handler,
  scheduled,
};

export default worker;
