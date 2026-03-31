CREATE TABLE IF NOT EXISTS "photos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "location_id" uuid NOT NULL,
  "student_id" uuid,
  "session_date" date NOT NULL,
  "caption" text,
  "file_url" text NOT NULL,
  "file_name" text NOT NULL,
  "file_size" integer,
  "mime_type" text,
  "uploaded_by" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "photos"
  ADD CONSTRAINT "photos_location_id_locations_id_fk"
  FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "photos"
  ADD CONSTRAINT "photos_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "photos"
  ADD CONSTRAINT "photos_uploaded_by_users_id_fk"
  FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
