ALTER TABLE "audit_runs" ADD COLUMN "project_id" text;--> statement-breakpoint
CREATE INDEX "audit_runs_project_history_idx" ON "audit_runs" USING btree ("project_id","created_at","id");