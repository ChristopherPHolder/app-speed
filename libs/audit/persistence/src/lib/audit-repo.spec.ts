import { ConfigProvider, Effect, Layer } from 'effect';
import { expect, layer } from '@effect/vitest';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { auditResultTable, auditRunTable, auditTemplateTable } from './schema';

import { AuditRepo, AuditRepoLive } from './audit-repo';
import { Audit } from '@app-speed/audit/domain';
import { DbClient } from './db';
import { InMemoryRecordPersistenceService } from './record/in-memory';
import { RecordPersistenceService } from './record/service';

const sampleAudit: Audit = {
  title: 'Sample audit',
  device: 'desktop',
  steps: [{ type: 'customStep', step: 'snapshot' }],
};

const testDbDir = path.join(process.cwd(), 'tmp');

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
    const CleanupLayer = Layer.scopedDiscard(
      Effect.addFinalizer(() => Effect.sync(() => fs.rmSync(testDbPath, { force: true }))),
    );

    return Layer.provideMerge(CleanupLayer)(DbLayer);
  }),
);

const TestLayer = Layer.provideMerge(Layer.merge(TestDbLayer, InMemoryRecordPersistenceService))(AuditRepoLive);

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

  it.effect('hydrates run details with the submitted audit snapshot', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;

      const templateId = yield* repo.createTemplate(sampleAudit);
      const runId = yield* repo.createRun(templateId);
      const runDetails = yield* repo.getRunDetailsById(runId);

      expect(runDetails).not.toBeNull();
      expect(runDetails?.id).toBe(runId);
      expect(runDetails?.status).toBe('SCHEDULED');
      expect(runDetails?.data).toEqual(sampleAudit);
      expect(runDetails?.queuePosition).toBe(0);
      expect(runDetails?.resultStatus).toBeNull();
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

  it.effect('completes a successful run and stores record keys in SQLite', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;
      const recordPersistence = yield* RecordPersistenceService;
      const db = yield* DbClient;

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

      const resultRow = yield* db.run((client) =>
        client
          .select({
            dataRecordKey: auditResultTable.dataRecordKey,
            reportHtmlRecordKey: auditResultTable.reportHtmlRecordKey,
            error: auditResultTable.error,
          })
          .from(auditResultTable)
          .where(eq(auditResultTable.runId, runId))
          .get(),
      );

      expect(resultRow).toEqual({
        dataRecordKey: `audit-result-data:${runId}`,
        reportHtmlRecordKey: `audit-result-report:${runId}`,
        error: null,
      });
      yield* Effect.gen(function* () {
        expect(yield* recordPersistence.get(recordPersistence.makeRecordKey(`audit-result-data:${runId}`))).toBe(
          '{"score":0.91}',
        );
        expect(yield* recordPersistence.get(recordPersistence.makeRecordKey(`audit-result-report:${runId}`))).toBe(
          '<html><body>report</body></html>',
        );
      });
    }),
  );

  it.effect('fails when a referenced success data record is missing', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;
      const db = yield* DbClient;

      const templateId = yield* repo.createTemplate(sampleAudit);
      const runId = yield* repo.createRun(templateId);
      yield* repo.markRunInProgress(runId);

      yield* db.run((client) =>
        client.transaction((tx) => {
          tx.update(auditRunTable).set({ status: 'COMPLETE', completedAt: new Date(), updatedAt: new Date() }).run();
          tx.insert(auditResultTable)
            .values({
              runId,
              status: 'SUCCESS',
              dataRecordKey: `audit-result-data:${runId}`,
              error: null,
              reportHtmlRecordKey: null,
              createdAt: new Date(),
            })
            .run();
        }),
      );

      const exit = yield* Effect.exit(repo.getResultByRunId(runId));
      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        expect(exit.cause.toString()).toContain('Referenced audit result data record is missing');
      }
    }),
  );

  it.effect('stores failure errors inline without record keys', () =>
    Effect.gen(function* () {
      yield* resetDb;

      const repo = yield* AuditRepo;
      const db = yield* DbClient;
      const error = { message: 'Lighthouse failed' };

      const templateId = yield* repo.createTemplate(sampleAudit);
      const runId = yield* repo.createRun(templateId);

      yield* repo.markRunInProgress(runId);
      yield* repo.completeRun(runId, { status: 'FAILURE', data: null, error }, 55);

      const result = yield* repo.getResultByRunId(runId);
      expect(result?.status).toBe('FAILURE');
      expect(result?.data).toBeNull();
      expect(result?.error).toEqual(error);
      expect(result?.reportHtml).toBeNull();

      const resultRow = yield* db.run((client) =>
        client
          .select({
            dataRecordKey: auditResultTable.dataRecordKey,
            error: auditResultTable.error,
            reportHtmlRecordKey: auditResultTable.reportHtmlRecordKey,
          })
          .from(auditResultTable)
          .where(eq(auditResultTable.runId, runId))
          .get(),
      );
      expect(resultRow).toEqual({ dataRecordKey: null, error, reportHtmlRecordKey: null });
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
