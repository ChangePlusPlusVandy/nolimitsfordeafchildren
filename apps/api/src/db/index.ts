import * as schema from "./schema";
import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle(process.env.POSTGRES_URI!, { schema });