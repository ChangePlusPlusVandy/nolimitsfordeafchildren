import type { ScheduleEntity } from "@/_platform/db/schema";

export interface CreateScheduleInput {
  site_id: string;
  session_id?: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
}

export interface UpdateScheduleInput {
  site_id?: string;
  session_id?: string;
  day_of_week_mask?: number;
  start_time?: string;
  end_time?: string;
  cycle_start_date?: string;
  cycle_end_date?: string;
  is_active?: boolean;
}

export interface ListSchedulesQuery {
  teacher_id?: string;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface AvailableSchedulesQuery {
  site_id?: string;
  day_of_week_mask?: number;
  day_pattern?: "mws" | "tths";
  exclude_current_schedule_id?: string;
  page?: number;
  limit?: number;
}

export interface ScheduleWithDetails extends ScheduleEntity {
  teacher: {
    id: string;
    user: { id: string; name: string; email: string };
  };
  site: { id: string; name: string };
  session?: { id: string; name: string } | null;
}

export interface ScheduleDetails extends ScheduleWithDetails {
  enrolledStudents: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    enrolled_at: Date;
  }>;
}

export interface ConflictCheckInput {
  teacher_id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  exclude_schedule_id?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    id: string;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
  }>;
}
