import { useHttpClient } from "../../../plugins/axios";

// ==================== TYPES ====================

export interface Student {
  id: string;
  site_id: string;
  first_name: string;
  last_name: string;
  initials: string;
  photo_url: string | null;
  dob: string;
  current_school: string | null;
  preferred_language: string;
  hearing_devices: string[];
  hearing_loss_type:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentListItem {
  id: string;
  initials: string;
  site_id: string;
  dob: string;
  is_active: boolean;
  // Only available for admins
  first_name?: string;
  last_name?: string;
}

export interface StudentDetails extends Student {
  site: {
    id: string;
    name: string;
    type: string;
  } | null;
  active_schedules?: Array<{
    id: string;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
    session?: {
      id: string;
      name: string;
    } | null;
    site: {
      id: string;
      name: string;
    };
    teacher: {
      id: string;
      name: string;
    };
  }>;
  schedule_history?: Array<{
    enrollment_id: string;
    enrolled_at: string;
    ended_at: string | null;
    is_current: boolean;
    schedule: {
      id: string;
      day_of_week_mask: number;
      start_time: string;
      end_time: string;
      cycle_start_date: string;
      cycle_end_date: string;
      is_active: boolean;
      session?: {
        id: string;
        name: string;
      } | null;
      site: {
        id: string;
        name: string;
      };
      teacher: {
        id: string;
        name: string;
      };
    };
  }>;
  siblings: Sibling[];
  teachers: LinkedTeacher[];
  parents: LinkedParent[];
  attendance_overview: AttendanceOverview | null;
}

export interface AttendanceRecentEntry {
  id: string;
  session_date: string;
  status: "present" | "late" | "no_show" | "cancelled";
  late_minutes: number | null;
  reason: "sick" | "family_emergency" | "transportation" | "schedule_conflict" | "no_show_unknown" | "other" | null;
  reason_text: string | null;
  marked_at: string;
  schedule_id: string;
  marked_by: {
    id: string;
    name: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  } | null;
}

export interface AttendanceOverview {
  total: number;
  present: number;
  late: number;
  no_show: number;
  cancelled: number;
  attendance_rate: number;
  recent_entries: AttendanceRecentEntry[];
}

export interface Sibling {
  id: string;
  name: string;
  age: number | null;
  relationship: string;
  is_participant: boolean;
  has_hearing_loss: boolean;
  photo_url: string | null;
  notes: string | null;
}

export interface LinkedTeacher {
  link_id: string;
  teacher_id: string;
  name: string;
  email: string;
  assigned_at: string;
}

export interface LinkedParent {
  link_id: string;
  parent_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
  is_primary: boolean;
  linked_at: string;
}

export interface StudentFilters {
  search?: string;
  site_id?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "initials" | "created_at" | "dob";
  order?: "asc" | "desc";
}

export interface ListStudentsResponse {
  items: StudentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateStudentInput {
  site_id: string;
  first_name: string;
  last_name: string;
  initials?: string;
  photo_url?: string;
  dob: string;
  current_school?: string;
  preferred_language?: string;
  hearing_devices?: string[];
  hearing_loss_type?:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary?: string;
}

export interface UpdateStudentInput {
  site_id?: string;
  first_name?: string;
  last_name?: string;
  initials?: string;
  photo_url?: string;
  dob?: string;
  current_school?: string;
  preferred_language?: string;
  hearing_devices?: string[];
  hearing_loss_type?:
    | "mild"
    | "moderate"
    | "moderately_severe"
    | "severe"
    | "profound"
    | "unknown"
    | null;
  guardian_summary?: string;
  is_active?: boolean;
}

export interface AddSiblingInput {
  name: string;
  age?: number;
  relationship: string;
  is_participant?: boolean;
  has_hearing_loss?: boolean;
  photo_url?: string;
  notes?: string;
}

export interface UpdateSiblingInput {
  name?: string;
  age?: number;
  relationship?: string;
  is_participant?: boolean;
  has_hearing_loss?: boolean;
  photo_url?: string;
  notes?: string;
}

export interface LinkTeacherInput {
  teacher_id: string;
}

export interface LinkParentInput {
  parent_id: string;
  relationship?: string;
  is_primary?: boolean;
}

// ==================== SERVICE ====================

export function useStudentHttpService() {
  const httpClient = useHttpClient();

  return {
    key: "students",

    queries: {
      /**
       * List students with filtering and pagination
       */
      index: async (params?: StudentFilters): Promise<ListStudentsResponse> => {
        const response = await httpClient.get("/v1/students", { params });
        return response.data;
      },

      /**
       * Get student details with siblings, teachers, and parents
       */
      show: async (id: string): Promise<StudentDetails> => {
        const response = await httpClient.get(`/v1/students/${id}`);
        return response.data;
      },

      /**
       * Get student's linked teachers
       */
      teachers: async (
        studentId: string,
        params?: { page?: number; limit?: number },
      ): Promise<{
        items: LinkedTeacher[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }> => {
        const response = await httpClient.get(`/v1/students/${studentId}/teachers`, { params });
        return response.data;
      },

      /**
       * Get student's linked parents
       */
      parents: async (
        studentId: string,
        params?: { page?: number; limit?: number },
      ): Promise<{
        items: LinkedParent[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }> => {
        const response = await httpClient.get(`/v1/students/${studentId}/parents`, { params });
        return response.data;
      },
    },

    mutations: {
      /**
       * Create a new student
       */
      create: async (payload: CreateStudentInput): Promise<Student> => {
        const response = await httpClient.post("/v1/students", payload);
        return response.data;
      },

      /**
       * Update a student
       */
      update: async ({ id, ...data }: UpdateStudentInput & { id: string }): Promise<Student> => {
        const response = await httpClient.patch(`/v1/students/${id}`, data);
        return response.data;
      },

      /**
       * Add a sibling to a student
       */
      addSibling: async ({
        studentId,
        ...data
      }: AddSiblingInput & { studentId: string }): Promise<Sibling> => {
        const response = await httpClient.post(`/v1/students/${studentId}/siblings`, data);
        return response.data;
      },

      /**
       * Update a sibling
       */
      updateSibling: async ({
        id,
        ...data
      }: UpdateSiblingInput & { id: string }): Promise<Sibling> => {
        const response = await httpClient.patch(`/v1/siblings/${id}`, data);
        return response.data;
      },

      /**
       * Remove a sibling
       */
      removeSibling: async (siblingId: string): Promise<{ ok: boolean }> => {
        const response = await httpClient.delete(`/v1/siblings/${siblingId}`);
        return response.data;
      },

      /**
       * Link a teacher to a student
       */
      linkTeacher: async ({
        studentId,
        teacher_id,
      }: LinkTeacherInput & { studentId: string }): Promise<{ ok: boolean; link_id: string }> => {
        const response = await httpClient.post(`/v1/students/${studentId}/teachers`, {
          teacher_id,
        });
        return response.data;
      },

      /**
       * Unlink a teacher from a student
       */
      unlinkTeacher: async ({
        studentId,
        teacherId,
      }: {
        studentId: string;
        teacherId: string;
      }): Promise<{ ok: boolean }> => {
        const response = await httpClient.delete(`/v1/students/${studentId}/teachers/${teacherId}`);
        return response.data;
      },

      /**
       * Link a parent to a student
       */
      linkParent: async ({
        studentId,
        ...data
      }: LinkParentInput & { studentId: string }): Promise<{ ok: boolean; link_id: string }> => {
        const response = await httpClient.post(`/v1/students/${studentId}/parents`, data);
        return response.data;
      },

      /**
       * Unlink a parent from a student
       */
      unlinkParent: async ({
        studentId,
        parentId,
      }: {
        studentId: string;
        parentId: string;
      }): Promise<{ ok: boolean }> => {
        const response = await httpClient.delete(`/v1/students/${studentId}/parents/${parentId}`);
        return response.data;
      },
    },
  };
}
