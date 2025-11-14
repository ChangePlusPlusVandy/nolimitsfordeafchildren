import { pgTable, text, uuid, boolean, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { LocationTable } from "@/domains/locations/models/entities/LocationTable";


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
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
)

export const TeacherTable = pgTable(
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
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
)

export const StudentTable = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    site_id: uuid("site_id").references(() => LocationTable.id),
    initials: varchar("column_name", { length: 8 }),
    first_name: text("first_name").notNull(),
    last_name: text("last_name").notNull(),
    dob: date("dob").notNull(),
    preferred_language: text("language").notNull(),
    guardian_summary: text("guardian_sumarry").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(), 
  }
)

export const ParentTable = pgTable(
  "parents",
  {
    user_id: uuid("parent_id").notNull().references(() => UserTable.id),
    household_notes: text("household_notes"),
    preferred_contact_method: text("contact_method").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
)

export const TeacherStudent = pgTable(
  "teacher_student",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacher_id: uuid("teacher_id").notNull().references(() => TeacherTable.user_id),
    student_id: uuid("stuent_id").notNull().references(() => StudentTable.id), 
    assigned_at: timestamp("assigned_at", { withTimezone: true}).notNull().defaultNow(),
    unassigned_at: timestamp("unassigned_at", {withTimezone: true}),
  }
)

export const ParentStudentLink = pgTable(
  "parent_student_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parent_id: uuid("parent_id").notNull().references(() => ParentTable.user_id),
    student_id: uuid("student_id").notNull().references(() => StudentTable.id),
    relationship: text("relationship"),
    linked_at: timestamp("linked_at", {withTimezone: true}).notNull().defaultNow(),
    revoked_at: timestamp("revoked_at", {withTimezone: true}),
  }
)

export type UserEntity = typeof UserTable.$inferSelect;
export type TeacherEntity = typeof TeacherTable.$inferSelect;
export type StudentEntity = typeof StudentTable.$inferSelect;
export type ParentEntity = typeof ParentTable.$inferSelect;
