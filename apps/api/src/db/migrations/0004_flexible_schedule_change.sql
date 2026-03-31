ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'negotiating';
--> statement-breakpoint
ALTER TABLE "schedule_change_requests"
  ALTER COLUMN "requested_schedule_id" DROP NOT NULL,
  ADD COLUMN "preferred_times" text,
  ADD COLUMN "flexibility_notes" text,
  ADD COLUMN "teacher_response_status" text,
  ADD COLUMN "teacher_response_notes" text,
  ADD COLUMN "teacher_responded_by" uuid,
  ADD COLUMN "teacher_responded_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "schedule_change_requests"
  ADD CONSTRAINT "schedule_change_requests_teacher_responded_by_users_id_fk"
  FOREIGN KEY ("teacher_responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_change_request_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "schedule_change_request_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "from_status" text,
  "to_status" text,
  "actor_user_id" uuid NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "schedule_change_request_events"
  ADD CONSTRAINT "schedule_change_request_events_schedule_change_request_id_fk"
  FOREIGN KEY ("schedule_change_request_id") REFERENCES "public"."schedule_change_requests"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "schedule_change_request_events"
  ADD CONSTRAINT "schedule_change_request_events_actor_user_id_fk"
  FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
