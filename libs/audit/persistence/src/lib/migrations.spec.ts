import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const testDbDir = path.join(process.cwd(), 'tmp');
const localMigrationsPath = path.join(process.cwd(), 'migrations');
const workspaceMigrationsPath = path.join(process.cwd(), 'libs/audit/persistence/migrations');
const migrationsPath = fs.existsSync(localMigrationsPath) ? localMigrationsPath : workspaceMigrationsPath;

const legacySchemaSql = `
CREATE TABLE "AuditTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "data" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

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

CREATE TABLE "AuditResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data" TEXT,
  "error" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AuditRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AuditTemplate_id_key" ON "AuditTemplate" ("id");
CREATE UNIQUE INDEX "AuditRun_id_key" ON "AuditRun" ("id");
CREATE UNIQUE INDEX "AuditResult_runId_key" ON "AuditResult" ("runId");
`;

const normalizeAuditTimestampsSql = fs.readFileSync(
  path.join(migrationsPath, '0001_normalize_legacy_audit_timestamps.sql'),
  'utf8',
);

describe('audit timestamp migrations', () => {
  let testDbPath: string | null = null;

  afterEach(() => {
    if (testDbPath) {
      fs.rmSync(testDbPath, { force: true });
      testDbPath = null;
    }
  });

  it('converts legacy text timestamps so newer integer-backed runs sort first', () => {
    fs.mkdirSync(testDbDir, { recursive: true });
    testDbPath = path.join(testDbDir, `audit-migration-${randomUUID()}.db`);

    const db = new Database(testDbPath);

    try {
      db.pragma('foreign_keys = ON');
      db.exec(legacySchemaSql);

      db.prepare('INSERT INTO "AuditTemplate" ("id", "data", "createdAt", "updatedAt") VALUES (?, ?, ?, ?)').run(
        'legacy-template',
        JSON.stringify({ title: 'Legacy audit', device: 'desktop', steps: [{ type: 'snapshot' }] }),
        '2026-02-10T10:00:00.000Z',
        '2026-02-10T10:00:00.000Z',
      );
      db.prepare(
        `
          INSERT INTO "AuditRun"
            ("id", "templateId", "status", "createdAt", "updatedAt", "startedAt", "completedAt", "durationMs")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        'legacy-run',
        'legacy-template',
        'COMPLETE',
        '2026-02-10T10:00:00.000Z',
        '2026-02-10T10:00:00.000Z',
        '2026-02-10T10:00:05.000Z',
        '2026-02-10T10:00:10.000Z',
        5000,
      );
      db.prepare(
        'INSERT INTO "AuditResult" ("id", "runId", "status", "data", "error", "createdAt") VALUES (?, ?, ?, ?, ?, ?)',
      ).run('legacy-result', 'legacy-run', 'SUCCESS', '{"score":0.9}', null, '2026-02-10T10:00:10.000Z');

      db.prepare('INSERT INTO "AuditTemplate" ("id", "data", "createdAt", "updatedAt") VALUES (?, ?, ?, ?)').run(
        'new-template',
        JSON.stringify({ title: 'New audit', device: 'mobile', steps: [{ type: 'snapshot' }] }),
        1773302904924,
        1773302904924,
      );
      db.prepare(
        `
          INSERT INTO "AuditRun"
            ("id", "templateId", "status", "createdAt", "updatedAt", "startedAt", "completedAt", "durationMs")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run('new-run', 'new-template', 'COMPLETE', 1773302904924, 1773302904924, 1773302906913, 1773302906922, 9);

      const beforeMigration = db
        .prepare(
          'SELECT "id", typeof("createdAt") AS "createdAtType" FROM "AuditRun" ORDER BY "createdAt" DESC LIMIT 1',
        )
        .get() as { id: string; createdAtType: string };

      expect(beforeMigration).toEqual({ id: 'legacy-run', createdAtType: 'text' });

      db.exec(normalizeAuditTimestampsSql);

      const afterMigration = db
        .prepare(
          'SELECT "id", typeof("createdAt") AS "createdAtType" FROM "AuditRun" ORDER BY "createdAt" DESC LIMIT 1',
        )
        .get() as { id: string; createdAtType: string };

      expect(afterMigration).toEqual({ id: 'new-run', createdAtType: 'integer' });

      const normalizedLegacyTypes = db
        .prepare(
          `
            SELECT
              typeof("createdAt") AS "createdAtType",
              typeof("updatedAt") AS "updatedAtType",
              typeof("startedAt") AS "startedAtType",
              typeof("completedAt") AS "completedAtType"
            FROM "AuditRun"
            WHERE "id" = 'legacy-run'
          `,
        )
        .get() as {
        createdAtType: string;
        updatedAtType: string;
        startedAtType: string;
        completedAtType: string;
      };

      expect(normalizedLegacyTypes).toEqual({
        createdAtType: 'integer',
        updatedAtType: 'integer',
        startedAtType: 'integer',
        completedAtType: 'integer',
      });

      const normalizedTemplateType = db
        .prepare(
          'SELECT typeof("createdAt") AS "createdAtType", typeof("updatedAt") AS "updatedAtType" FROM "AuditTemplate" WHERE "id" = ?',
        )
        .get('legacy-template') as { createdAtType: string; updatedAtType: string };
      expect(normalizedTemplateType).toEqual({
        createdAtType: 'integer',
        updatedAtType: 'integer',
      });

      const normalizedResultType = db
        .prepare('SELECT typeof("createdAt") AS "createdAtType" FROM "AuditResult" WHERE "id" = ?')
        .get('legacy-result') as { createdAtType: string };
      expect(normalizedResultType).toEqual({ createdAtType: 'integer' });
    } finally {
      db.close();
    }
  });
});
