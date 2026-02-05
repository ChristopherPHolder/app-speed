import { Effect, Layer } from 'effect';
import { it, expect, layer } from '@effect/vitest';

import { AuditRepo, AuditRepoLive } from './audit-repo';
import { ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';
import { DbClient } from './db';

const sampleAudit: ReplayUserflowAudit = {
  title: 'Sample audit',
  device: 'desktop',
  steps: [{ type: 'snapshot' }],
};

const TestLayer = Layer.provide(AuditRepoLive, DbClient.live);

const resetDb = Effect.gen(function* () {
  const db = yield* DbClient;
  yield* db.run((c) => c.auditResult.deleteMany({}));
  yield* db.run((c) => c.auditRun.deleteMany({}));
  yield* db.run((c) => c.auditTemplate.deleteMany({}));
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
      yield* repo.completeRun(runId, { status: 'SUCCESS', data: { score: 0.91 } }, 1234);

      const run = yield* repo.getRunById(runId);
      const result = yield* repo.getResultByRunId(runId);

      expect(run?.status).toBe('COMPLETE');
      expect(run?.durationMs).toBe(1234);
      expect(result?.status).toBe('SUCCESS');
      expect(result?.data).toEqual({ score: 0.91 });
      expect(result?.error).toBeNull();
    }),
  );
});
