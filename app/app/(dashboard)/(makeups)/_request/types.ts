export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

export interface CreateMakeupRequestInput {
  student_id: string;
  original_session_date: string;
  original_schedule_id: string;
  reason: AbsenceReason;
  reason_text?: string;
  preferred_dates?: string;
  requested_by: string;
}
