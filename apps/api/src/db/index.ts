import * as schema from "./schema";
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URI!,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });