import type { IHttpService } from "../../../utils/IHttpService"
import { useHttpClient } from "../../../plugins/axios"

// Types based on API responses
export interface LinkedChild {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
  dob: string;
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
  attendance_status?: "present" | "no_show" | "cancelled" | null;
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

export interface ChildDetails {
  id: string;
  first_name: string;
  last_name: string;
  initials: string;
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
}

export interface MyChildrenResponse {
  items: LinkedChild[];
}

export function useParentHttpService(): IHttpService & {
  queries: {
    myChildren: () => Promise<MyChildrenResponse>;
    childDetails: (studentId: string) => Promise<ChildDetails>;
  };
} {
  const httpClient = useHttpClient()

  return {
    key: 'parents',
    mutations: {},
    queries: {
      myChildren: async (): Promise<MyChildrenResponse> => {
        const response = await httpClient.get(`/v1/parents/me/children`)
        return response.data
      },
      childDetails: async (studentId: string): Promise<ChildDetails> => {
        const response = await httpClient.get(`/v1/parents/children/${studentId}`)
        return response.data
      }
    }
  }
}
