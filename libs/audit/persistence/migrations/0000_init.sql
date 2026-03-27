CREATE TABLE IF NOT EXISTS "AuditTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "data" TEXT NOT NULL,
  "createdAt" INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  "updatedAt" INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))
);

CREATE TABLE IF NOT EXISTS "AuditRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "templateId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  "updatedAt" INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  "startedAt" INTEGER,
  "completedAt" INTEGER,
  "durationMs" INTEGER,
  CONSTRAINT "AuditRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AuditTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data" TEXT,
  "error" TEXT,
  "createdAt" INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER)),
  CONSTRAINT "AuditResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AuditRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuditTemplate_id_key" ON "AuditTemplate" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "AuditRun_id_key" ON "AuditRun" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "AuditResult_runId_key" ON "AuditResult" ("runId");
