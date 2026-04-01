CREATE TABLE IF NOT EXISTS attendance_sibling_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES attendance(id),
  sibling_id uuid NOT NULL REFERENCES siblings(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_sibling_participants_attendance_id_sibling_id_idx
  ON attendance_sibling_participants (attendance_id, sibling_id);

CREATE INDEX IF NOT EXISTS attendance_sibling_participants_sibling_id_idx
  ON attendance_sibling_participants (sibling_id);
