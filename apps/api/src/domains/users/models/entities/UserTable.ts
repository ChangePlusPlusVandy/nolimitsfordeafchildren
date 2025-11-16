import { pgTable, text, uuid, boolean, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { LocationTable } from "@/domains/locations/models/entities/LocationTable";
import { ScheduleTable } from "@/domains/schedule/models/entities/ScheduleTable";


/* ---------------- USER ---------------- */

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

/* ---------------- TEACHER ---------------- */

export const TeacherProfileTable = pgTable(
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

/* ---------------- STUDENT ---------------- */

export const StudentTable = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    site_id: uuid("site_id").references(() => LocationTable.id),
    initials: varchar("initials", { length: 8 }),
    first_name: text("first_name").notNull(),
    last_name: text("last_name").notNull(),
    dob: date("dob").notNull(),
    preferred_language: text("language").notNull(),
    guardian_summary: text("guardian_sumarry").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(), 
  }
)


/* ---------------- PARENT ---------------- */

export const ParentProfileTable = pgTable(
  "parents",
  {
    user_id: uuid("parent_id").notNull().references(() => UserTable.id),
    household_notes: text("household_notes"),
    preferred_contact_method: text("contact_method").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
)

/* ---------------- TEACHER–STUDENT LINK ---------------- */

export const TeacherStudent = pgTable(
  "teacher_student",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacher_id: uuid("teacher_id").notNull().references(() => TeacherProfileTable.user_id),
    student_id: uuid("student_id").notNull().references(() => StudentTable.id), 
    assigned_at: timestamp("assigned_at", { withTimezone: true}).notNull().defaultNow(),
    unassigned_at: timestamp("unassigned_at", {withTimezone: true}),
  }
)


/* ---------------- PARENT–STUDENT LINK ---------------- */

export const ParentStudentLink = pgTable(
  "parent_student_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parent_id: uuid("parent_id").notNull().references(() => ParentProfileTable.user_id),
    student_id: uuid("student_id").notNull().references(() => StudentTable.id),
    relationship: text("relationship"),
    linked_at: timestamp("linked_at", {withTimezone: true}).notNull().defaultNow(),
    revoked_at: timestamp("revoked_at", {withTimezone: true}),
  }
)

/* ---------------- ATTENDANCE ---------------- */

export const AttendanceTable = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    student_id: uuid("student_id").references(() => StudentTable.id),
    schedule_id: uuid("schedule_id").references(() => ScheduleTable.id),
    date: date("date"),
    //status
    reason: text("reason"),
    marked_by: uuid("marked_by").references(() => UserTable.id),
    marked_at: timestamp("marked_at", {withTimezone: true}).defaultNow(),
  }
)

/* ---------------- ENROLLMENT ---------------- */

export const EnrollmentTable = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    student_id: uuid("student_id").references(() => StudentTable.id),
    schedule_id: uuid("schedule_id").references(() => ScheduleTable.id),
    //status
    enrolled_at: timestamp("enrolled_at", {withTimezone: true}).defaultNow(),
    ended_at: timestamp("ended_at", {withTimezone: true}),
  }
)

export type UserEntity = typeof UserTable.$inferSelect;
export type TeacherEntity = typeof TeacherProfileTable.$inferSelect;
export type StudentEntity = typeof StudentTable.$inferSelect;
export type ParentEntity = typeof ParentProfileTable.$inferSelect;
