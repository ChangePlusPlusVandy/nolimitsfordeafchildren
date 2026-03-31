ALTER TABLE "bulletins"
  ADD COLUMN "requires_approval" boolean NOT NULL DEFAULT false,
  ADD COLUMN "approval_status" text NOT NULL DEFAULT 'approved',
  ADD COLUMN "reviewed_by" uuid,
  ADD COLUMN "reviewed_at" timestamp with time zone,
  ADD COLUMN "review_notes" text;
--> statement-breakpoint
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
