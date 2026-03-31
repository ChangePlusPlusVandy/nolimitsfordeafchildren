import type { IHttpService } from "../../../utils/IHttpService";
import { useHttpClient } from "../../../plugins/axios";

// Types based on API responses
export interface LinkedChild {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  photo_url: string | null;
  dob: string;
  current_schedule_id: string | null;
  site: {
    id: string;
    name: string;
  };
  next_session?: {
    date: string;
    time: string;
    teacher_name: string;
  } | null;
  attendance_summary: {
    total: number;
    present: number;
    attendance_rate: number;
  };
  pending_requests: number;
}

export interface ChildScheduleSession {
  schedule_id: string;
  date: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  teacher: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
  attendance_status?: "present" | "late" | "no_show" | "cancelled" | null;
}

export interface MissedSession {
  schedule_id: string;
  date: string;
  reason: string | null;
  can_request_makeup: boolean;
}

export interface RelevantBulletin {
  id: string;
  title: string;
  body: string | null;
  publish_at: string | null;
}

export type ParentDocumentType =
  | "audiogram"
  | "iep"
  | "annual_test_result"
  | "pre_report"
  | "graduation_speech"
  | "other";

export interface ChildDocument {
  id: string;
  document_type: ParentDocumentType;
  file_name: string;
  file_url: string;
  created_at: string;
  review_status: "approved" | "pending" | "rejected";
  session_date: string | null;
}

export interface DirectoryPerson {
  id: string;
  role: "administrator" | "teacher";
  name: string;
  email: string;
  bio: string | null;
  photo_url: string | null;
}

export interface ParentZipReportItem {
  parent_user_id: string;
  parent_name: string;
  parent_email: string;
  postal_code: string;
  city: string | null;
  state: string | null;
  linked_students: number;
}

export interface ParentZipReportGroup {
  postal_code: string;
  parent_count: number;
  student_count: number;
  parents: ParentZipReportItem[];
}

export interface ChildDetails {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  photo_url: string | null;
  dob: string;
  preferred_language: string;
  current_school: string | null;
  site: {
    id: string;
    name: string;
  };
  upcoming_sessions: ChildScheduleSession[];
  recent_sessions: ChildScheduleSession[];
  attendance_summary: {
    total: number;
    present: number;
    no_show: number;
    cancelled: number;
    attendance_rate: number;
  };
  pending_makeup_requests: number;
  pending_schedule_change_requests: number;
  missed_sessions: MissedSession[];
  relevant_bulletins: RelevantBulletin[];
  approved_documents: ChildDocument[];
  siblings: Array<{
    id: string;
    name: string;
    age: number | null;
    relationship: string;
    is_participant: boolean;
    has_hearing_loss: boolean;
  }>;
}

export interface MyChildrenResponse {
  items: LinkedChild[];
}

export function useParentHttpService(): IHttpService & {
  queries: {
    myChildren: () => Promise<MyChildrenResponse>;
    childDetails: (studentId: string) => Promise<ChildDetails>;
    directory: () => Promise<{ items: DirectoryPerson[] }>;
    zipReport: () => Promise<{ items: ParentZipReportGroup[] }>;
  };
} {
  const httpClient = useHttpClient();

  return {
    key: "parents",
    mutations: {},
    queries: {
      myChildren: async (): Promise<MyChildrenResponse> => {
        const response = await httpClient.get(`/v1/parents/me/children`);
        return response.data;
      },
      childDetails: async (studentId: string): Promise<ChildDetails> => {
        const response = await httpClient.get(`/v1/parents/children/${studentId}`);
        return response.data;
      },
      directory: async (): Promise<{ items: DirectoryPerson[] }> => {
        const response = await httpClient.get(`/v1/parents/directory`);
        return response.data;
      },
      zipReport: async (): Promise<{ items: ParentZipReportGroup[] }> => {
        const response = await httpClient.get(`/v1/parents/zip-report`);
        return response.data;
      },
    },
  };
}
