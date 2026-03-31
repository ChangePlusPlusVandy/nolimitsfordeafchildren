ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "photo_url" text;
--> statement-breakpoint
ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "photo_url" text;
