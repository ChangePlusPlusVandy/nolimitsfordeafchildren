import { pgTable, text, uuid, boolean, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { locationTable } from "@/domains/locations/models/entities/LocationTable";


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
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updtated_at", { withTimezone: true }).notNull().defaultNow(),
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
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updtated_at", { withTimezone: true }).notNull().defaultNow(),
  }
)

export const studentTable = pgTable(
  "students",
  {
    id: uuid("students").primaryKey().defaultRandom(),
    site_id: uuid("site_id").references(() => locationTable.id),
    initials: varchar("column_name", { length: 8 }),
    first_name: text("first_name").notNull(),
    last_name: text("last_name").notNull(),
    dob: date("dob").notNull(),
    preferred_language: text("language").notNull(),
    guardian_summary: text("guardian_sumarry").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updtated_at", { withTimezone: true }).notNull().defaultNow(), 
  }
)

export const parentTable = pgTable(
  "parents",
  {
    id: uuid("parents").primaryKey().defaultRandom(),
    user_id: uuid("parent_id").notNull().references(() => UserTable.id),
    household_notes: text("household_notes"),
    preferred_contact_method: text("contact_method").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updtated_at", { withTimezone: true }).notNull().defaultNow(),
  }
)

export const teacherStudent = pgTable(
  "teacher_student",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacher_id: uuid("teacher_id").notNull().references(() => teacherTable.user_id),
    student_id: uuid("stuent_id").notNull().references(() => studentTable.id), 
    assigned_at: timestamp("assigned_at", { withTimezone: true}).notNull(),
    unassigned_at: timestamp("unassigned_at", {withTimezone: true}).notNull(),
  }
)

export type UserEntity = typeof UserTable.$inferSelect;
export type TeacherEntity = typeof teacherTable.$inferSelect;
export type StudentEntity = typeof parentTable.$inferSelect;