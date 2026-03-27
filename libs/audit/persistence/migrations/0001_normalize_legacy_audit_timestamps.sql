-- Normalize legacy DATETIME text values to millisecond integers so SQLite ordering
-- stays stable after newer code starts writing timestamp_ms values.
UPDATE "AuditTemplate"
SET "createdAt" = CAST((julianday("createdAt") - 2440587.5) * 86400000 AS INTEGER)
WHERE typeof("createdAt") = 'text';

UPDATE "AuditTemplate"
SET "updatedAt" = CAST((julianday("updatedAt") - 2440587.5) * 86400000 AS INTEGER)
WHERE typeof("updatedAt") = 'text';

UPDATE "AuditRun"
SET "createdAt" = CAST((julianday("createdAt") - 2440587.5) * 86400000 AS INTEGER)
WHERE typeof("createdAt") = 'text';

UPDATE "AuditRun"
SET "updatedAt" = CAST((julianday("updatedAt") - 2440587.5) * 86400000 AS INTEGER)
WHERE typeof("updatedAt") = 'text';

UPDATE "AuditRun"
SET "startedAt" = CAST((julianday("startedAt") - 2440587.5) * 86400000 AS INTEGER)
WHERE typeof("startedAt") = 'text';

UPDATE "AuditRun"
SET "completedAt" = CAST((julianday("completedAt") - 2440587.5) * 86400000 AS INTEGER)
WHERE typeof("completedAt") = 'text';

UPDATE "AuditResult"
SET "createdAt" = CAST((julianday("createdAt") - 2440587.5) * 86400000 AS INTEGER)
WHERE typeof("createdAt") = 'text';
