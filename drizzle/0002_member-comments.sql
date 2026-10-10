CREATE TABLE "member_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_comment_page_id_check" CHECK ("member_comment"."page_id" ~ '^[0-9a-fA-F-]{32,36}$'),
	CONSTRAINT "member_comment_content_length_check" CHECK (char_length(btrim("member_comment"."content")) between 3 and 1000)
);
--> statement-breakpoint
ALTER TABLE "member_comment" ADD CONSTRAINT "member_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_comment_page_created_idx" ON "member_comment" USING btree ("page_id","created_at","id");--> statement-breakpoint
CREATE INDEX "member_comment_user_idx" ON "member_comment" USING btree ("user_id");
--> statement-breakpoint
ALTER TABLE public."member_comment" ENABLE ROW LEVEL SECURITY;