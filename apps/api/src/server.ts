import "dotenv/config";
import "reflect-metadata";
import { buildApplication } from ".";
import { initializeCronJobs } from "./cron";
import { runMigrations } from "./db/migrate";
import { seedDemo } from "./db/seed-demo";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    // Run database migrations before starting the server
    await runMigrations();

    // Seed demo data (idempotent — safe to re-run on every deploy)
    await seedDemo();

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
