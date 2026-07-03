CREATE TYPE "public"."hazard_category" AS ENUM('Flooding', 'Open Pothole', 'Power Grid Down', 'Fallen Tree');--> statement-breakpoint
CREATE TYPE "public"."sos_status" AS ENUM('Open', 'Resolved');--> statement-breakpoint
CREATE TABLE "hazard_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category" "hazard_category" NOT NULL,
	"severity_level" integer NOT NULL,
	"description" text,
	"image_url" text,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"upvotes_count" integer DEFAULT 0 NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sos_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_type" text NOT NULL,
	"message" text NOT NULL,
	"status" "sos_status" DEFAULT 'Open' NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"latitude" real,
	"longitude" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hazard_reports" ADD CONSTRAINT "hazard_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_requests" ADD CONSTRAINT "sos_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;