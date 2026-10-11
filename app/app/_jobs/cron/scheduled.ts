import { initD1, setDb } from "@/_platform/db";

import { runScheduledJobs } from "./index";

export async function scheduled(event: ScheduledEvent, env: CloudflareEnv, ctx: ExecutionContext) {
  console.log("[Cron] scheduled event:", event.cron);

  // Scheduled events have no request context; inject their D1 binding first.
  setDb(env.DB);
  await initD1(env.DB);

  const summary = await runScheduledJobs(event.cron);
  console.log("[Cron] completed:", summary);

  void ctx;
}
