ALTER TABLE "audit_templates" ADD COLUMN "title" text;
--> statement-breakpoint
UPDATE "audit_templates"
SET "title" = "user_flow_audit_templates"."definition"->>'title'
FROM "user_flow_audit_templates"
WHERE "user_flow_audit_templates"."template_id" = "audit_templates"."id";
--> statement-breakpoint
ALTER TABLE "audit_templates" ALTER COLUMN "title" SET NOT NULL;
