CREATE INDEX IF NOT EXISTS students_site_active_initials_idx
  ON students (site_id, is_active, initials);

CREATE INDEX IF NOT EXISTS students_created_at_idx
  ON students (created_at DESC);

CREATE INDEX IF NOT EXISTS locations_active_name_idx
  ON locations (is_active, name);

CREATE INDEX IF NOT EXISTS locations_type_idx
  ON locations (type);

CREATE INDEX IF NOT EXISTS locations_created_at_idx
  ON locations (created_at DESC);

CREATE INDEX IF NOT EXISTS schedule_change_requests_status_requested_at_idx
  ON schedule_change_requests (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS schedule_change_requests_student_id_idx
  ON schedule_change_requests (student_id);

CREATE INDEX IF NOT EXISTS schedule_change_requests_current_schedule_id_idx
  ON schedule_change_requests (current_schedule_id);

CREATE INDEX IF NOT EXISTS schedule_change_requests_requested_schedule_id_idx
  ON schedule_change_requests (requested_schedule_id);

CREATE INDEX IF NOT EXISTS makeup_requests_status_requested_at_idx
  ON makeup_requests (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS makeup_requests_student_id_idx
  ON makeup_requests (student_id);

CREATE INDEX IF NOT EXISTS makeup_requests_original_schedule_id_idx
  ON makeup_requests (original_schedule_id);

CREATE INDEX IF NOT EXISTS makeup_sessions_makeup_request_id_created_at_idx
  ON makeup_sessions (makeup_request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS makeup_sessions_teacher_date_idx
  ON makeup_sessions (teacher_id, scheduled_date);

CREATE INDEX IF NOT EXISTS photos_location_session_created_idx
  ON photos (location_id, session_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS photos_student_session_created_idx
  ON photos (student_id, session_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS session_notes_student_created_at_idx
  ON session_notes (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS session_notes_teacher_created_at_idx
  ON session_notes (teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS assessments_student_cycle_type_idx
  ON assessments (student_id, cycle_start_date DESC, assessment_type);

CREATE INDEX IF NOT EXISTS assessments_student_cycle_idx
  ON assessments (student_id, cycle_start_date DESC);

CREATE INDEX IF NOT EXISTS bulletins_approval_status_created_at_idx
  ON bulletins (approval_status, created_at DESC);
