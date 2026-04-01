ALTER TABLE bulletins
  ADD COLUMN IF NOT EXISTS requires_initials boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS teacher_sick_day_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teacher_profiles(id),
  site_id uuid NOT NULL REFERENCES locations(id),
  notice_date date NOT NULL,
  note text,
  bulletin_id uuid REFERENCES bulletins(id),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_sick_day_notices_teacher_date_idx
  ON teacher_sick_day_notices (teacher_id, notice_date DESC);

CREATE INDEX IF NOT EXISTS teacher_sick_day_notices_site_date_idx
  ON teacher_sick_day_notices (site_id, notice_date DESC);
