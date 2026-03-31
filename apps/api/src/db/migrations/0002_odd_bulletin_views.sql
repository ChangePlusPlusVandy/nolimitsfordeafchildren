CREATE TABLE "bulletin_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bulletin_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bulletin_views" ADD CONSTRAINT "bulletin_views_bulletin_id_bulletins_id_fk" FOREIGN KEY ("bulletin_id") REFERENCES "public"."bulletins"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bulletin_views" ADD CONSTRAINT "bulletin_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "bulletin_views_bulletin_id_user_id_idx" ON "bulletin_views" USING btree ("bulletin_id","user_id");
