import { runAudiogramJob } from "./audiogramJob";
import { runBirthdayJob } from "./birthdayJob";

export { runAudiogramJob } from "./audiogramJob";
export { runBirthdayJob } from "./birthdayJob";

export interface CronJobSummary {
  birthday: { sent: number; errors: number };
  audiogram: { sent: number; errors: number };
}

/**
 * Dispatch both Cron Trigger jobs.
 *
 * Called from `worker.ts`'s `scheduled(event)` handler once the D1 binding
 * has been injected via `setDb(env.DB)`. Cloudflare invokes the same handler
 * for every cron expression, so jobs are filterable by `event.cron` if we
 * ever want per-schedule dispatch; for now both run, which is idempotent and
 * cheap at this scale (birthday window = next 7 days, audiogram = next 30).
 */
export async function runScheduledJobs(): Promise<CronJobSummary> {
  console.log("[Cron] Running scheduled jobs...");

  const birthday = await runBirthdayJob();
  const audiogram = await runAudiogramJob();

  console.log(
    `[Cron] Birthday job: ${birthday.sent} sent, ${birthday.errors} errors; ` +
      `Audiogram job: ${audiogram.sent} sent, ${audiogram.errors} errors`,
  );

  return { birthday, audiogram };
}
