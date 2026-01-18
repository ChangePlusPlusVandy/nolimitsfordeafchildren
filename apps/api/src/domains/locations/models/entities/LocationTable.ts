import { pgTable, text, uuid, timestamp, numeric } from "drizzle-orm/pg-core";

export const LocationTable = pgTable(
    "locations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("location_name").notNull(),
        //type
        address_line1: text("address_line1").notNull(),
        address_line2: text("address_line2"),
        city: text("location_city").notNull(),
        state: text("location_state").notNull(),
        postal_code: text("postal_code").notNull(),
        country: text("location_country").notNull(),
        latitude: numeric("latitude",{precision: 9, scale: 6}),
        longitude: numeric("longitude",{precision: 9, scale: 6}),
        time_zone: text("timezone"),
        created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updated_at: timestamp("updtated_at", { withTimezone: true }).notNull().defaultNow(),
    }
)

export type LocationEntity = typeof LocationTable.$inferSelect;
