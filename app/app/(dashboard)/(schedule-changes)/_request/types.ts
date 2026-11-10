export interface CreateScheduleChangeInput {
  student_id: string;
  current_schedule_id: string;
  requested_schedule_id?: string;
  preferred_times?: string;
  flexibility_notes?: string;
  reason: string;
  requested_by: string;
}
