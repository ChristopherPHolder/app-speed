-- CreateTable
CREATE TABLE "AuditTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "durationMs" INTEGER,
    CONSTRAINT "AuditRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AuditTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB,
    "error" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AuditRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditTemplate_id_key" ON "AuditTemplate"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AuditRun_id_key" ON "AuditRun"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AuditResult_runId_key" ON "AuditResult"("runId");
