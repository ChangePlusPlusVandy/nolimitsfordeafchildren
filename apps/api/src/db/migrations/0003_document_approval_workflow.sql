ALTER TYPE "document_type" ADD VALUE IF NOT EXISTS 'pre_report';
ALTER TYPE "document_type" ADD VALUE IF NOT EXISTS 'graduation_speech';

CREATE TYPE "document_review_status" AS ENUM('approved', 'pending', 'rejected');

ALTER TABLE "documents"
  ADD COLUMN "review_status" "document_review_status" NOT NULL DEFAULT 'approved',
  ADD COLUMN "reviewed_by" uuid,
  ADD COLUMN "reviewed_at" timestamp with time zone,
  ADD COLUMN "review_notes" text,
  ADD COLUMN "session_date" date,
  ADD COLUMN "session_type" text;

ALTER TABLE "documents"
  ADD CONSTRAINT "documents_reviewed_by_users_id_fk"
  FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
