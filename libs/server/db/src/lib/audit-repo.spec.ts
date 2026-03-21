import { ConfigProvider, Effect, Layer } from 'effect';
import { expect, layer } from '@effect/vitest';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { auditResultTable, auditRunTable, auditTemplateTable } from './schema';

import { AuditRepo, AuditRepoLive } from './audit-repo';
import { ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';
import { DbClient } from './db';

const sampleAudit: ReplayUserflowAudit = {
  title: 'Sample audit',
  device: 'desktop',
  steps: [{ type: 'snapshot' }],
};

const testDbDir = path.join(process.cwd(), 'tmp');
const localMigrationsPath = path.join(process.cwd(), 'migrations');
const workspaceMigrationsPath = path.join(process.cwd(), 'libs/server/db/migrations');
const migrationsPath = fs.existsSync(localMigrationsPath) ? localMigrationsPath : workspaceMigrationsPath;

const applyMigrations = (dbPath: string) => {
  const migrationFiles = fs
    .readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const sqlite = new Database(dbPath);

  try {
    sqlite.pragma('foreign_keys = ON');
    for (const migrationFile of migrationFiles) {
      const migrationSql = fs.readFileSync(path.join(migrationsPath, migrationFile), 'utf8');
      sqlite.exec(migrationSql);
    }
  } finally {
    sqlite.close();
  }
};

const TestDbLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    yield* Effect.sync(() => fs.mkdirSync(testDbDir, { recursive: true }));
    const testDbPath = path.join(testDbDir, `audit-repo-${randomUUID()}.db`);
    const relativeTestDbPath = path.relative(process.cwd(), testDbPath);
    yield* Effect.sync(() => fs.writeFileSync(testDbPath, ''));

    const ConfigLayer = Layer.setConfigProvider(
      ConfigProvider.fromMap(new Map([['DATABASE_URL', relativeTestDbPath]])),
    );
    const DbLayer = Layer.provideMerge(ConfigLayer)(DbClient.live);
    const MigrationsLayer = Layer.scopedDiscard(
      Effect.gen(function* () {
        yield* Effect.sync(() => applyMigrations(testDbPath));
        yield* Effect.addFinalizer(() => Effect.sync(() => fs.rmSync(testDbPath, { force: true })));
      }),
    );

    return Layer.provideMerge(MigrationsLayer)(DbLayer);
  }),
);

const TestLayer = Layer.provideMerge(TestDbLayer)(AuditRepoLive);

const resetDb = Effect.gen(function* () {
  const db = yield* DbClient;
  yield* db.run((c) =>
    c.transaction((tx) => {
      tx.delete(auditResultTable).run();
      tx.delete(auditRunTable).run();
      tx.delete(auditTemplateTable).run();
    }),
  );
});

layer(TestLayer)('AuditRepo (contract)', (it) => {
  it.effect('creates a template and reads it back', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;

      const templateId = yield* repo.createTemplate(sampleAudit);
      const template = yield* repo.getTemplateById(templateId);

      expect(template).not.toBeNull();
      expect(template?.id).toBe(templateId);
      expect(template?.data).toEqual(sampleAudit);
    }),
  );

  it.effect('creates a run and reads it back', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;

      const templateId = yield* repo.createTemplate(sampleAudit);
      const runId = yield* repo.createRun(templateId);
      const run = yield* repo.getRunById(runId);

      expect(run).not.toBeNull();
      expect(run?.id).toBe(runId);
      expect(run?.templateId).toBe(templateId);
      expect(run?.status).toBe('SCHEDULED');
    }),
  );

  it.effect('claims the next scheduled run and marks it in progress', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;

      const templateId = yield* repo.createTemplate(sampleAudit);
      const runId = yield* repo.createRun(templateId);

      const claimed = yield* repo.claimNextRun();
      expect(claimed?.id).toBe(runId);
      expect(claimed?.status).toBe('IN_PROGRESS');
    }),
  );

  it.effect('returns null when no scheduled runs exist', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;
      const claimed = yield* repo.claimNextRun();
      expect(claimed).toBeNull();
    }),
  );

  it.effect('completes a run and stores the result', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;

      const templateId = yield* repo.createTemplate(sampleAudit);
      const runId = yield* repo.createRun(templateId);

      yield* repo.markRunInProgress(runId);
      yield* repo.completeRun(
        runId,
        { status: 'SUCCESS', data: { score: 0.91 }, reportHtml: '<html><body>report</body></html>' },
        1234,
      );

      const run = yield* repo.getRunById(runId);
      const result = yield* repo.getResultByRunId(runId);

      expect(run?.status).toBe('COMPLETE');
      expect(run?.durationMs).toBe(1234);
      expect(result?.status).toBe('SUCCESS');
      expect(result?.data).toEqual({ score: 0.91 });
      expect(result?.error).toBeNull();
      expect(result?.reportHtml).toBe('<html><body>report</body></html>');
    }),
  );

  it.effect('lists runs newest first with stable ordering', () =>
    Effect.gen(function* () {
      yield* resetDb;
      const repo = yield* AuditRepo;

      const templateA = yield* repo.createTemplate({ ...sampleAudit, title: 'Audit A' });
      const runA = yield* repo.createRun(templateA);

      const templateB = yield* repo.createTemplate({ ...sampleAudit, title: 'Audit B' });
      const runB = yield* repo.createRun(templateB);

      const templateC = yield* repo.createTemplate({ ...sampleAudit, title: 'Audit C' });
      const runC = yield* repo.createRun(templateC);

      const page = yield* repo.listRunsPage({
        limit: 25,
        cursor: null,
        status: null,
      });

      expect(new Set(page.items.map((run) => run.id))).toEqual(new Set([runA, runB, runC]));
      page.items.slice(1).forEach((run, index) => {
        const previous = page.items[index];
        const createdAtIsDescending = previous.createdAt.getTime() > run.createdAt.getTime();
        const tieBreakIsDescending = previous.createdAt.getTime() === run.createdAt.getTime() && previous.id > run.id;
        expect(createdAtIsDescending || tieBreakIsDescending).toBe(true);
      });
      expect(page.nextCursor).toBeNull();
    }),
  );

  it.effect('paginates with cursor without duplicates or gaps', () =>
    Effect.gen(function* () {
      yield* resetDb;
      const repo = yield* AuditRepo;

      const template1 = yield* repo.createTemplate({ ...sampleAudit, title: 'Audit 1' });
      const run1 = yield* repo.createRun(template1);

      const template2 = yield* repo.createTemplate({ ...sampleAudit, title: 'Audit 2' });
      const run2 = yield* repo.createRun(template2);

      const template3 = yield* repo.createTemplate({ ...sampleAudit, title: 'Audit 3' });
      const run3 = yield* repo.createRun(template3);

      const template4 = yield* repo.createTemplate({ ...sampleAudit, title: 'Audit 4' });
      const run4 = yield* repo.createRun(template4);

      const expectedAll = yield* repo.listRunsPage({
        limit: 25,
        cursor: null,
        status: null,
      });

      const firstPage = yield* repo.listRunsPage({
        limit: 2,
        cursor: null,
        status: null,
      });
      const secondPage = yield* repo.listRunsPage({
        limit: 2,
        cursor: firstPage.nextCursor,
        status: null,
      });

      const ids = [...firstPage.items.map((item) => item.id), ...secondPage.items.map((item) => item.id)];
      expect(new Set(ids)).toEqual(new Set([run1, run2, run3, run4]));
      expect(ids).toEqual(expectedAll.items.slice(0, 4).map((item) => item.id));
      expect(new Set(ids).size).toBe(4);
    }),
  );

  it.effect('supports status filtering when listing runs', () =>
    Effect.gen(function* () {
      yield* resetDb;
      const repo = yield* AuditRepo;

      const scheduledTemplate = yield* repo.createTemplate({ ...sampleAudit, title: 'Scheduled audit' });
      const scheduledRunId = yield* repo.createRun(scheduledTemplate);

      const inProgressTemplate = yield* repo.createTemplate({ ...sampleAudit, title: 'Running audit' });
      const inProgressRunId = yield* repo.createRun(inProgressTemplate);
      yield* repo.markRunInProgress(inProgressRunId);

      const completeTemplate = yield* repo.createTemplate({ ...sampleAudit, title: 'Complete audit' });
      const completeRunId = yield* repo.createRun(completeTemplate);
      yield* repo.markRunInProgress(completeRunId);
      yield* repo.completeRun(completeRunId, { status: 'SUCCESS', data: { score: 0.8 } }, 777);

      const scheduledOnly = yield* repo.listRunsPage({
        limit: 25,
        cursor: null,
        status: ['SCHEDULED'],
      });
      const terminalStatuses = yield* repo.listRunsPage({
        limit: 25,
        cursor: null,
        status: ['IN_PROGRESS', 'COMPLETE'],
      });

      expect(scheduledOnly.items.map((item) => item.id)).toEqual([scheduledRunId]);
      expect(terminalStatuses.items.map((item) => item.id).sort()).toEqual([completeRunId, inProgressRunId].sort());
    }),
  );
});
