CREATE TABLE "user_flow_audit_results" (
	"result_id" uuid PRIMARY KEY NOT NULL,
	"flow_result_record_key" text NOT NULL,
	"report_html_record_key" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_flow_audit_results" ADD CONSTRAINT "user_flow_audit_results_result_id_audit_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."audit_results"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "audit_results" DROP COLUMN "data_record_key";--> statement-breakpoint
ALTER TABLE "audit_results" DROP COLUMN "report_html_record_key";