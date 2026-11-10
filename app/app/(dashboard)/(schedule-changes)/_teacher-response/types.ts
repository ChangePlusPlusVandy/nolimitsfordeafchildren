export interface TeacherScheduleChangeResponseInput {
  response_status: "available" | "unavailable" | "conditional";
  notes?: string;
}
