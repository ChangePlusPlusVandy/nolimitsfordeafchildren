import { pgTable, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";


export const UserTable = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auth0Id: text("auth0_id").notNull().unique(),
    name: text("name").notNull(),
    //email: citext("email").notNull(),
    password_hash: text("password_hash").notNull(),
    phone: text("phone").notNull(),
    locale: text("locale").notNull(),
    is_active: boolean("is_active").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updtated_at").notNull().defaultNow(),

  }
)

export const teacherTable = pgTable(
  "teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull().references(() => UserTable.id),
    bio: text("bio"),
    photo_url: text("photo_url"),
    qualifications: text("qualifications"),
    credentials: text("credentials"),
    cv_file_url: text("cv_file_url"),
    primary_site_id: uuid("primary_site_id").notNull().references(() => UserTable.locale),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updtated_at").notNull().defaultNow(),
  }
)

export type UserEntity = typeof UserTable.$inferSelect;