import { useHttpClient } from "../../../plugins/axios";

// ==================== TYPES ====================

export interface Student {
  id: string;
  site_id: string;
  first_name: string;
  last_name: string;
  initials: string;
  dob: string;
  current_school: string | null;
  preferred_language: string;
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
  siblings: Sibling[];
  teachers: LinkedTeacher[];
  parents: LinkedParent[];
}

export interface Sibling {
  id: string;
  name: string;
  age: number | null;
  relationship: string;
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
  limit?: number;
  cursor?: string;
}

export interface ListStudentsResponse {
  items: StudentListItem[];
  nextCursor: string | null;
}

export interface CreateStudentInput {
  site_id: string;
  first_name: string;
  last_name: string;
  initials?: string;
  dob: string;
  current_school?: string;
  preferred_language?: string;
  guardian_summary?: string;
}

export interface UpdateStudentInput {
  site_id?: string;
  first_name?: string;
  last_name?: string;
  initials?: string;
  dob?: string;
  current_school?: string;
  preferred_language?: string;
  guardian_summary?: string;
  is_active?: boolean;
}

export interface AddSiblingInput {
  name: string;
  age?: number;
  relationship: string;
  photo_url?: string;
  notes?: string;
}

export interface UpdateSiblingInput {
  name?: string;
  age?: number;
  relationship?: string;
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
      teachers: async (studentId: string): Promise<{ items: LinkedTeacher[]; nextCursor: null }> => {
        const response = await httpClient.get(`/v1/students/${studentId}/teachers`);
        return response.data;
      },

      /**
       * Get student's linked parents
       */
      parents: async (studentId: string): Promise<{ items: LinkedParent[] }> => {
        const response = await httpClient.get(`/v1/students/${studentId}/parents`);
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
      addSibling: async ({ studentId, ...data }: AddSiblingInput & { studentId: string }): Promise<Sibling> => {
        const response = await httpClient.post(`/v1/students/${studentId}/siblings`, data);
        return response.data;
      },

      /**
       * Update a sibling
       */
      updateSibling: async ({ id, ...data }: UpdateSiblingInput & { id: string }): Promise<Sibling> => {
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
      linkTeacher: async ({ studentId, teacher_id }: LinkTeacherInput & { studentId: string }): Promise<{ ok: boolean; link_id: string }> => {
        const response = await httpClient.post(`/v1/students/${studentId}/teachers`, { teacher_id });
        return response.data;
      },

      /**
       * Unlink a teacher from a student
       */
      unlinkTeacher: async ({ studentId, teacherId }: { studentId: string; teacherId: string }): Promise<{ ok: boolean }> => {
        const response = await httpClient.delete(`/v1/students/${studentId}/teachers/${teacherId}`);
        return response.data;
      },

      /**
       * Link a parent to a student
       */
      linkParent: async ({ studentId, ...data }: LinkParentInput & { studentId: string }): Promise<{ ok: boolean; link_id: string }> => {
        const response = await httpClient.post(`/v1/students/${studentId}/parents`, data);
        return response.data;
      },

      /**
       * Unlink a parent from a student
       */
      unlinkParent: async ({ studentId, parentId }: { studentId: string; parentId: string }): Promise<{ ok: boolean }> => {
        const response = await httpClient.delete(`/v1/students/${studentId}/parents/${parentId}`);
        return response.data;
      },
    },
  };
}
