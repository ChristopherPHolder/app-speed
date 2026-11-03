CREATE TABLE "audit_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"through_at" timestamp with time zone,
	"count" integer DEFAULT 1 NOT NULL,
	"outcome" text NOT NULL,
	"run_id" uuid,
	"version_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"space_id" text NOT NULL,
	"template_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"recurrence" jsonb NOT NULL,
	"state" text DEFAULT 'active' NOT NULL,
	"next_due_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "audit_shares_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "audit_spaces" (
	"id" text PRIMARY KEY NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_runs" ADD COLUMN "version_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_runs" ADD COLUMN "schedule_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_templates" ADD COLUMN "space_id" text;--> statement-breakpoint
ALTER TABLE "audit_templates" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "audit_templates" ADD COLUMN "guest_browser_hash" text;--> statement-breakpoint
ALTER TABLE "audit_templates" ADD COLUMN "claim_hash" text;--> statement-breakpoint
ALTER TABLE "audit_templates" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_occurrences" ADD CONSTRAINT "audit_occurrences_schedule_id_audit_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."audit_schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_occurrences" ADD CONSTRAINT "audit_occurrences_run_id_audit_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."audit_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_occurrences" ADD CONSTRAINT "audit_occurrences_version_id_audit_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."audit_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_schedules" ADD CONSTRAINT "audit_schedules_space_id_audit_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."audit_spaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_schedules" ADD CONSTRAINT "audit_schedules_template_id_audit_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."audit_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_schedules" ADD CONSTRAINT "audit_schedules_version_id_audit_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."audit_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_shares" ADD CONSTRAINT "audit_shares_run_id_audit_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."audit_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_versions" ADD CONSTRAINT "audit_versions_template_id_audit_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."audit_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "audit_occurrences_schedule_due_key" ON "audit_occurrences" USING btree ("schedule_id","due_at");--> statement-breakpoint
CREATE INDEX "audit_schedules_due_idx" ON "audit_schedules" USING btree ("state","next_due_at");--> statement-breakpoint
ALTER TABLE "audit_runs" ADD CONSTRAINT "audit_runs_version_id_audit_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."audit_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_runs" ADD CONSTRAINT "audit_runs_schedule_id_audit_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."audit_schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_templates" ADD CONSTRAINT "audit_templates_space_id_audit_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."audit_spaces"("id") ON DELETE no action ON UPDATE no action;