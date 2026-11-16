CREATE TYPE "public"."audience" AS ENUM('B2C', 'B2B');--> statement-breakpoint
CREATE TYPE "public"."challenge_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('RESEARCHER', 'COMPANY', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('CONFIRMS', 'REJECTS', 'UNCLEAR');--> statement-breakpoint
CREATE TABLE "challenge_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"researcher_id" uuid NOT NULL,
	"message" text NOT NULL,
	"status" "response_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"field" text NOT NULL,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"min_trl" integer,
	"deadline" timestamp with time zone,
	"status" "challenge_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hypotheses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"statement" text NOT NULL,
	"audience" "audience" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_verdicts" (
	"interview_id" uuid NOT NULL,
	"hypothesis_id" uuid NOT NULL,
	"verdict" "verdict" NOT NULL,
	CONSTRAINT "interview_verdicts_interview_id_hypothesis_id_pk" PRIMARY KEY("interview_id","hypothesis_id")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"interviewee_role" text NOT NULL,
	"organization_type" text NOT NULL,
	"past_behaviour" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"pain_tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"field" text NOT NULL,
	"summary" text NOT NULL,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"trl" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"patent_count" integer NOT NULL,
	"query" text NOT NULL,
	"source" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"organization" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "challenge_responses" ADD CONSTRAINT "challenge_responses_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_responses" ADD CONSTRAINT "challenge_responses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_responses" ADD CONSTRAINT "challenge_responses_researcher_id_users_id_fk" FOREIGN KEY ("researcher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_company_id_users_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hypotheses" ADD CONSTRAINT "hypotheses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_verdicts" ADD CONSTRAINT "interview_verdicts_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_verdicts" ADD CONSTRAINT "interview_verdicts_hypothesis_id_hypotheses_id_fk" FOREIGN KEY ("hypothesis_id") REFERENCES "public"."hypotheses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_partners" ADD CONSTRAINT "saved_partners_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "responses_challenge_project_uq" ON "challenge_responses" USING btree ("challenge_id","project_id");--> statement-breakpoint
CREATE INDEX "challenges_status_idx" ON "challenges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hypotheses_project_idx" ON "hypotheses" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "interviews_project_idx" ON "interviews" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_owner_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_partners_project_name_uq" ON "saved_partners" USING btree ("project_id","name");