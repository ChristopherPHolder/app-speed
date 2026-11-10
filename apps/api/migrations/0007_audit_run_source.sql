ALTER TABLE "audit_runs" ADD COLUMN "source" text DEFAULT 'portal' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_runs" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "audit_runs" ADD COLUMN "client_name" text;