import { pgTable, text, uuid, timestamp, numeric } from "drizzle-orm/pg-core";
import { LocationTable } from "@/domains/locations/models/entities/LocationTable";
import { UserTable } from "@/db/schema";

export const BulletinTable = pgTable(
    "locations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        //scope
        site_id: uuid("site_id").notNull().references(() => LocationTable.id),
        //role_target
        title: text("title").notNull(),
        body: text("body"),
        publish_at: timestamp("publish_at", { withTimezone: true }), 
        expire_at: timestamp("expire_at", { withTimezone: true }), 
        created_by: uuid("created_by").notNull().references(() => UserTable.id),
        created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp("updtated_at", { withTimezone: true }).notNull().defaultNow(),
    }
)

export type BulletinEntity = typeof BulletinTable.$inferSelect;