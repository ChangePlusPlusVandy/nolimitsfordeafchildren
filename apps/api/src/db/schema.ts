import { UserTable } from "@/domains/users/models/entities/UserTable";
import { customType } from "drizzle-orm/pg-core";

export const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export { UserTable };
