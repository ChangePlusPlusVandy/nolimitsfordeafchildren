ALTER TABLE "user" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "locale" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;