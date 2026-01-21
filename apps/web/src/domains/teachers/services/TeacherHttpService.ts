import { useHttpClient } from "../../../plugins/axios";

export type AgeGroupSpecialty =
  | "infant"
  | "toddler"
  | "preschool"
  | "elementary"
  | "middle_school"
  | "high_school"
  | "young_adult"
  | "all_ages";

export interface Teacher {
  id: string;
  user_id: string;
  primary_site_id: string | null;
  bio: string | null;
  photo_url: string | null;
  qualifications: string | null;
  credentials: string | null;
  age_group_specialty: AgeGroupSpecialty | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
  };
  primarySite?: {
    id: string;
    name: string;
  } | null;
}

export interface TeacherDetails extends Teacher {
  schedules: Array<{
    id: string;
    teacher_id: string;
    site_id: string;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
    is_active: boolean;
    site: { id: string; name: string };
  }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    initials: string;
    site: { id: string; name: string };
  }>;
}

export interface ListTeachersParams {
  search?: string;
  specialty?: AgeGroupSpecialty;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "created_at";
  order?: "asc" | "desc";
}

export interface ListTeachersResponse {
  items: Teacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTeacherInput {
  user_id: string;
  primary_site_id?: string;
  bio?: string;
  photo_url?: string;
  qualifications?: string;
  credentials?: string;
  age_group_specialty?: AgeGroupSpecialty;
}

export interface UpdateTeacherInput {
  primary_site_id?: string;
  bio?: string;
  photo_url?: string;
  qualifications?: string;
  credentials?: string;
  age_group_specialty?: AgeGroupSpecialty;
}

export interface CreateScheduleInput {
  site_id: string;
  day_of_week_mask: number;
  start_time: string;
  end_time: string;
  cycle_start_date: string;
  cycle_end_date: string;
}

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
}

export type AttendanceStatus = "present" | "no_show" | "cancelled";
export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

export interface SessionForDay {
  schedule_id: string;
  student_id: string;
  student_initials: string;
  student_first_name: string;
  student_last_name: string;
  start_time: string;
  end_time: string;
  site_id: string;
  site_name: string;
  attendance?: {
    id: string;
    status: AttendanceStatus;
    reason: AbsenceReason | null;
    reason_text: string | null;
    marked_at: string;
  } | null;
}

export interface MyDayResponse {
  sessions: SessionForDay[];
}

export function useTeacherHttpService() {
  const httpClient = useHttpClient();

  return {
    key: "teachers",

    queries: {
      /**
       * List teachers with filtering and pagination
       */
      index: async (params?: ListTeachersParams): Promise<ListTeachersResponse> => {
        const response = await httpClient.get("/v1/teachers", { params });
        return response.data;
      },

      /**
       * Get a single teacher by ID with details
       */
      show: async (id: string): Promise<TeacherDetails> => {
        const response = await httpClient.get(`/v1/teachers/${id}`);
        return response.data;
      },

      /**
       * Get teacher's assigned students
       */
      students: async (
        id: string,
        params?: { page?: number; limit?: number }
      ): Promise<{
        items: Array<{
          id: string;
          first_name: string;
          last_name: string;
          initials: string;
          dob: string;
          is_active: boolean;
          assigned_at: string;
          site: { id: string; name: string };
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }> => {
        const response = await httpClient.get(`/v1/teachers/${id}/students`, { params });
        return response.data;
      },

      /**
       * Get current teacher's day schedule
       */
      myDay: async (params?: { date?: string }): Promise<MyDayResponse> => {
        const response = await httpClient.get("/v1/teachers/me/day", { params });
        return response.data;
      },
    },

    mutations: {
      /**
       * Create a new teacher profile
       */
      create: async (payload: CreateTeacherInput): Promise<Teacher> => {
        const response = await httpClient.post("/v1/teachers", payload);
        return response.data;
      },

      /**
       * Update a teacher profile
       */
      update: async ({ id, ...data }: UpdateTeacherInput & { id: string }): Promise<Teacher> => {
        const response = await httpClient.patch(`/v1/teachers/${id}`, data);
        return response.data;
      },

      /**
       * Create a schedule for a teacher
       */
      createSchedule: async ({
        teacherId,
        ...data
      }: CreateScheduleInput & { teacherId: string }): Promise<Schedule> => {
        const response = await httpClient.post(`/v1/teachers/${teacherId}/schedules`, data);
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
 * Helper to encode days into mask
 */
export function encodeDayMask(days: string[]): number {
  let mask = 0;
  if (days.includes("Sun")) mask |= 1;
  if (days.includes("Mon")) mask |= 2;
  if (days.includes("Tue")) mask |= 4;
  if (days.includes("Wed")) mask |= 8;
  if (days.includes("Thu")) mask |= 16;
  if (days.includes("Fri")) mask |= 32;
  if (days.includes("Sat")) mask |= 64;
  return mask;
}

/**
 * Predefined schedule patterns
 */
export const SCHEDULE_PATTERNS = {
  MWS: { label: "Mon/Wed/Sat", mask: 74 }, // 2 + 8 + 64
  TThS: { label: "Tue/Thu/Sat", mask: 84 }, // 4 + 16 + 64
};

/**
 * Age group specialty labels
 */
export const AGE_GROUP_LABELS: Record<AgeGroupSpecialty, string> = {
  infant: "Infant (0-1)",
  toddler: "Toddler (1-3)",
  preschool: "Preschool (3-5)",
  elementary: "Elementary (5-11)",
  middle_school: "Middle School (11-14)",
  high_school: "High School (14-18)",
  young_adult: "Young Adult (18-21)",
  all_ages: "All Ages",
};
