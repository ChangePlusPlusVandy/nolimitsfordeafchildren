import cron from "node-cron";
import { runBirthdayJob } from "./birthdayJob";
import { runAudiogramJob } from "./audiogramJob";

/**
 * Initialize all cron jobs
 * Called from server.ts on startup
 */
export function initializeCronJobs(): void {
  console.log("[Cron] Initializing scheduled jobs...");

  // Birthday notifications - Daily at 8:00 AM
  // Checks for birthdays in the next 7 days
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("[Cron] Running birthday notification job...");
      try {
        const result = await runBirthdayJob();
        console.log(
          `[Cron] Birthday job completed: ${result.sent} notifications sent, ${result.errors} errors`,
        );
      } catch (error) {
        console.error("[Cron] Birthday job failed:", error);
      }
    },
    {
      timezone: "America/Los_Angeles",
    },
  );

  // Audiogram reminders - Weekly on Monday at 9:00 AM
  // Checks for audiograms due in the next 30 days
  cron.schedule(
    "0 9 * * 1",
    async () => {
      console.log("[Cron] Running audiogram reminder job...");
      try {
        const result = await runAudiogramJob();
        console.log(
          `[Cron] Audiogram job completed: ${result.sent} reminders sent, ${result.errors} errors`,
        );
      } catch (error) {
        console.error("[Cron] Audiogram job failed:", error);
      }
    },
    {
      timezone: "America/Los_Angeles",
    },
  );

  console.log("[Cron] Scheduled jobs initialized:");
  console.log("  - Birthday notifications: Daily at 8:00 AM PT");
  console.log("  - Audiogram reminders: Weekly on Monday at 9:00 AM PT");
}

/**
 * Manually trigger jobs (for testing/admin purposes)
 */
export async function runJobManually(
  jobName: "birthday" | "audiogram",
): Promise<{ sent: number; errors: number }> {
  switch (jobName) {
    case "birthday":
      return runBirthdayJob();
    case "audiogram":
      return runAudiogramJob();
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
}
