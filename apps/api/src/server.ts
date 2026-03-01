import "dotenv/config";
import "reflect-metadata";
import { buildApplication } from ".";
import { initializeCronJobs } from "./cron";
import { runMigrations } from "./db/migrate";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    // Run database migrations before starting the server
    await runMigrations();

    const app = buildApplication();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);

      // Initialize scheduled jobs
      initializeCronJobs();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
