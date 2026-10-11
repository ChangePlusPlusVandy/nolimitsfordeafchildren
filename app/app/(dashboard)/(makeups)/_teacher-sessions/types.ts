import type { MakeupSessionEntity } from "@/_platform/db/schema";

export type AttendanceStatus = "present" | "late" | "no_show" | "cancelled";

export interface MakeupSessionWithDetails extends MakeupSessionEntity {
  student?: {
    id: string;
    initials: string;
    first_name: string;
    last_name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
  site?: {
    id: string;
    name: string;
  };
}
