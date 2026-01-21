import { useHttpClient } from "../../../plugins/axios";

export interface Schedule {
  id: string;
  teacher_id: string;
  site_id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  teacher: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  site: {
    id: string;
    name: string;
  };
}

export interface ScheduleDetails extends Schedule {
  enrolledStudents: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    enrolled_at: string;
  }>;
}

export interface ListSchedulesParams {
  teacher_id?: string;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface ListSchedulesResponse {
  items: Schedule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AvailableSchedulesParams {
  site_id?: string;
  day_of_week_mask?: number;
  page?: number;
  limit?: number;
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

export interface ConflictCheckResult {
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

export interface UpdateScheduleInput {
  site_id?: string;
  day_of_week_mask?: number;
  start_time?: string;
  end_time?: string;
  cycle_start_date?: string;
  cycle_end_date?: string;
  is_active?: boolean;
}

export function useScheduleHttpService() {
  const httpClient = useHttpClient();

  return {
    key: "schedules",

    queries: {
      /**
       * List schedules with filtering and pagination
       */
      index: async (params?: ListSchedulesParams): Promise<ListSchedulesResponse> => {
        const response = await httpClient.get("/v1/schedules", { params });
        return response.data;
      },

      /**
       * Get available schedules for parents to browse
       */
      available: async (params?: AvailableSchedulesParams): Promise<ListSchedulesResponse> => {
        const response = await httpClient.get("/v1/schedules/available", { params });
        return response.data;
      },

      /**
       * Get a single schedule by ID with details
       */
      show: async (id: string): Promise<ScheduleDetails> => {
        const response = await httpClient.get(`/v1/schedules/${id}`);
        return response.data;
      },
    },

    mutations: {
      /**
       * Update a schedule
       */
      update: async ({ id, ...data }: UpdateScheduleInput & { id: string }): Promise<Schedule> => {
        const response = await httpClient.patch(`/v1/schedules/${id}`, data);
        return response.data;
      },

      /**
       * Check for schedule conflicts
       */
      checkConflicts: async (input: ConflictCheckInput): Promise<ConflictCheckResult> => {
        const response = await httpClient.post("/v1/schedules/conflicts/check", input);
        return response.data;
      },
    },
  };
}

/**
 * Helper to decode day of week mask into readable format
 */
export function decodeDayMask(mask: number): string[] {
  const days: string[] = [];
  if (mask & 1) days.push("Sun");
  if (mask & 2) days.push("Mon");
  if (mask & 4) days.push("Tue");
  if (mask & 8) days.push("Wed");
  if (mask & 16) days.push("Thu");
  if (mask & 32) days.push("Fri");
  if (mask & 64) days.push("Sat");
  return days;
}

/**
 * Helper to format time for display
 */
export function formatScheduleTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours!, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

/**
 * Helper to format schedule for display
 */
export function formatScheduleSummary(schedule: {
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
}): string {
  const days = decodeDayMask(schedule.day_of_week_mask).join("/");
  const time = `${formatScheduleTime(schedule.start_time)} - ${formatScheduleTime(schedule.end_time)}`;
  return `${days}, ${time}`;
}
