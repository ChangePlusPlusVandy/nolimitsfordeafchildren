import * as schema from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const shouldUseSsl =
  process.env.POSTGRES_SSL === "true" ||
  (process.env.POSTGRES_URI?.includes("sslmode=require") ?? false);

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URI,
  ...(shouldUseSsl
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {}),
});

export const db = drizzle(pool, { schema });
