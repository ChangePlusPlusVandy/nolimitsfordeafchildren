CREATE TYPE "public"."chat_channel" AS ENUM('community', 'teacher');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "channel" "chat_channel" NOT NULL DEFAULT 'community',
  "message" text NOT NULL,
  "is_announcement" boolean NOT NULL DEFAULT false,
  "created_by" uuid NOT NULL,
  "deleted_at" timestamp with time zone,
  "deleted_by" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chat_messages"
  ADD CONSTRAINT "chat_messages_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages"
  ADD CONSTRAINT "chat_messages_deleted_by_users_id_fk"
  FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
