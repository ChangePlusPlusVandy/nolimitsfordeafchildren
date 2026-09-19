import { runAudiogramJob } from "./audiogramJob";
import { runBirthdayJob } from "./birthdayJob";

export { runAudiogramJob } from "./audiogramJob";
export { runBirthdayJob } from "./birthdayJob";

export interface CronJobSummary {
  birthday: { sent: number; errors: number };
  audiogram: { sent: number; errors: number };
}

const EMPTY = { sent: 0, errors: 0 } as const;

/** Daily birthday notifications (8:00 AM PT). */
export const BIRTHDAY_CRON = "0 16 * * *";
/** Weekly audiogram reminders (Monday 9:00 AM PT). */
export const AUDIOGRAM_CRON = "0 17 * * 1";

/**
 * Dispatch Cron Trigger jobs by `event.cron`.
 *
 * Cloudflare invokes the same `scheduled` handler for every expression in
 * wrangler.jsonc; running both jobs on every trigger would send audiogram
 * reminders daily instead of Mondays.
 */
export async function runScheduledJobs(cron?: string): Promise<CronJobSummary> {
  console.log("[Cron] Running scheduled jobs...", cron ?? "(all)");

  const runBirthday = !cron || cron === BIRTHDAY_CRON;
  const runAudiogram = !cron || cron === AUDIOGRAM_CRON;

  const birthday = runBirthday ? await runBirthdayJob() : { ...EMPTY };
  const audiogram = runAudiogram ? await runAudiogramJob() : { ...EMPTY };

  console.log(
    `[Cron] Birthday job: ${birthday.sent} sent, ${birthday.errors} errors; ` +
      `Audiogram job: ${audiogram.sent} sent, ${audiogram.errors} errors`,
  );

  return { birthday, audiogram };
}
