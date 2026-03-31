ALTER TYPE "attendance_status" ADD VALUE IF NOT EXISTS 'late';

ALTER TABLE "attendance"
  ADD COLUMN "late_minutes" integer;
