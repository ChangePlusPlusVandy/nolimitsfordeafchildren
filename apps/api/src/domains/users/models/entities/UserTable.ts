import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const UserTable = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auth0Id: text("auth0_id").notNull().unique(),
  }
)

export type UserEntity = typeof UserTable.$inferSelect;