DO $$ BEGIN
  CREATE TYPE hearing_loss_type AS ENUM (
    'mild',
    'moderate',
    'moderately_severe',
    'severe',
    'profound',
    'unknown'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS hearing_devices text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS hearing_loss_type hearing_loss_type;

CREATE INDEX IF NOT EXISTS teacher_locations_location_id_idx
  ON teacher_locations (location_id);
