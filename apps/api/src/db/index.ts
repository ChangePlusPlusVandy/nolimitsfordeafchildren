import * as schema from "./schema";
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.POSTGRES_URI!, { schema });