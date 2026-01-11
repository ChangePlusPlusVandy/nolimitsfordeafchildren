import { pgTable, text, uuid, timestamp, time, integer, date, boolean } from "drizzle-orm/pg-core";
import { LocationTable } from "@/domains/locations/models/entities/LocationTable";
import { TeacherProfileTable } from "@/domains/users/models/entities/UserTable";


export const ScheduleTable = pgTable(
    "schedules",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        site_id: uuid("location_id").notNull().references(() => LocationTable.id),
        teacher_id: uuid("teacher_id").notNull().references(() => TeacherProfileTable.id),
        //pattern
        day_of_week_mask: integer("day_of_week_mask"),
        start_time: time("start_time"),
        end_time: time("end_time"),
        cycle_start_date: date("cycle_start_date"),
        cycle_end_date: date("cycle_end_date"),
        is_saturday: boolean("is_saturday"),
        active: boolean("is_active"),
        created_at: timestamp("publish_at", {withTimezone: true}).defaultNow(),
        updated_at: timestamp("updated_at", {withTimezone: true}).defaultNow(),
    }
)