CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth0_id" text NOT NULL,
	CONSTRAINT "user_auth0_id_unique" UNIQUE("auth0_id")
);
