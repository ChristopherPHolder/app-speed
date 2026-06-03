CREATE TABLE "AuditResult_new" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "dataRecordKey" TEXT,
  "error" TEXT,
  "reportHtmlRecordKey" TEXT,
  "createdAt" INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  CONSTRAINT "AuditResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AuditRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "AuditResult_new" ("id", "runId", "status", "dataRecordKey", "error", "reportHtmlRecordKey", "createdAt")
SELECT "id", "runId", "status", NULL, "error", NULL, "createdAt"
FROM "AuditResult";

DROP TABLE "AuditResult";
ALTER TABLE "AuditResult_new" RENAME TO "AuditResult";
CREATE UNIQUE INDEX "AuditResult_runId_key" ON "AuditResult" ("runId");
