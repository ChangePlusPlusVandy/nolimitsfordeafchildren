CREATE TABLE "teacher_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_profile_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_locations" ADD CONSTRAINT "teacher_locations_teacher_profile_id_teacher_profiles_id_fk" FOREIGN KEY ("teacher_profile_id") REFERENCES "public"."teacher_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_locations" ADD CONSTRAINT "teacher_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_locations_teacher_profile_id_location_id_idx" ON "teacher_locations" USING btree ("teacher_profile_id","location_id");