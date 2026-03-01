import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migrations
 * This function is safe to call on every app start - it will only run pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log("Running database migrations...");

  // Always use SSL with rejectUnauthorized: false for DigitalOcean managed databases
  // DO uses self-signed certificates that Node.js won't trust by default
  const pool = new pg.Pool({
    connectionString: process.env.POSTGRES_URI,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const db = drizzle(pool);

  try {
    // The migrations folder path relative to this file
    const migrationsFolder = path.join(__dirname, "migrations");

    await migrate(db, { migrationsFolder });
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Database migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Allow running directly: npx tsx src/db/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}
