DELETE FROM "audit_results";--> statement-breakpoint
DELETE FROM "audit_runs";--> statement-breakpoint
DELETE FROM "audit_templates";--> statement-breakpoint
CREATE TABLE "user_flow_audit_templates" (
	"template_id" uuid PRIMARY KEY NOT NULL,
	"definition" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_templates" ADD COLUMN "kind" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_flow_audit_templates" ADD CONSTRAINT "user_flow_audit_templates_template_id_audit_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."audit_templates"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "audit_templates" DROP COLUMN "data";
