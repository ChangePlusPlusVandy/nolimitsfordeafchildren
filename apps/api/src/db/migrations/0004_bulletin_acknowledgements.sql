CREATE TABLE IF NOT EXISTS "bulletin_acknowledgements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bulletin_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "initials" varchar(8) NOT NULL,
  "acknowledged_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bulletin_acknowledgements"
  ADD CONSTRAINT "bulletin_acknowledgements_bulletin_id_bulletins_id_fk"
  FOREIGN KEY ("bulletin_id") REFERENCES "public"."bulletins"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bulletin_acknowledgements"
  ADD CONSTRAINT "bulletin_acknowledgements_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bulletin_acknowledgements_bulletin_id_user_id_idx"
  ON "bulletin_acknowledgements" USING btree ("bulletin_id", "user_id");
