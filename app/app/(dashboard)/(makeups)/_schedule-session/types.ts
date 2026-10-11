export interface CreateMakeupSessionInput {
  makeup_request_id?: string;
  student_id: string;
  teacher_id: string;
  site_id: string;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
  created_by: string;
}
