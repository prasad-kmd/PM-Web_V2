CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_user_capacity" (
	"singleton" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"registered_users" integer DEFAULT 0 NOT NULL,
	"max_users" integer DEFAULT 50 NOT NULL,
	CONSTRAINT "auth_user_capacity_singleton_check" CHECK ("auth_user_capacity"."singleton" = true),
	CONSTRAINT "auth_user_capacity_limit_check" CHECK ("auth_user_capacity"."max_users" = 50),
	CONSTRAINT "auth_user_capacity_count_check" CHECK ("auth_user_capacity"."registered_users" >= 0 and "auth_user_capacity"."registered_users" <= "auth_user_capacity"."max_users")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_role_check" CHECK ("user"."role" in ('user', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
--> statement-breakpoint
DO $$
BEGIN
  IF (SELECT count(*) FROM "user") > 50 THEN
    RAISE EXCEPTION 'Cannot enable the 50-account cap: the user table already contains more than 50 accounts.';
  END IF;
END;
$$;
--> statement-breakpoint
INSERT INTO "auth_user_capacity" ("singleton", "registered_users", "max_users")
SELECT TRUE, count(*)::integer, 50 FROM "user"
ON CONFLICT ("singleton") DO NOTHING;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.reserve_auth_user_slot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  reserved boolean;
BEGIN
  UPDATE public.auth_user_capacity
     SET registered_users = registered_users + 1
   WHERE singleton = TRUE
     AND registered_users < max_users
   RETURNING singleton INTO reserved;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SITE_AUTH_USER_LIMIT_REACHED'
      USING ERRCODE = '23514', CONSTRAINT = 'auth_user_capacity_limit_check';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.reserve_auth_user_slot() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER auth_user_capacity_after_insert
AFTER INSERT ON public."user"
FOR EACH ROW EXECUTE FUNCTION public.reserve_auth_user_slot();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.release_auth_user_slot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.auth_user_capacity
     SET registered_users = registered_users - 1
   WHERE singleton = TRUE
     AND registered_users > 0;
  RETURN OLD;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.release_auth_user_slot() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER auth_user_capacity_after_delete
AFTER DELETE ON public."user"
FOR EACH ROW EXECUTE FUNCTION public.release_auth_user_slot();
--> statement-breakpoint
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."session" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."account" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."verification" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.rate_limit ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.auth_user_capacity ENABLE ROW LEVEL SECURITY;