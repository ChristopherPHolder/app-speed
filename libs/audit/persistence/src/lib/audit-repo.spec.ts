import { Effect } from 'effect';
import { expect, describe, it } from 'vitest';

import { AuditRepo } from './audit-repo';
import { AuditRepoInMemory } from './audit-repo/in-memory';
import { Audit } from '@app-speed/audit/domain';

const sampleAudit: Audit = {
  title: 'Sample audit',
  device: 'desktop',
  steps: [{ type: 'customStep', step: 'snapshot' }],
};

const runWithInMemoryRepo = <A, E>(effect: Effect.Effect<A, E, AuditRepo>) =>
  Effect.runPromise(effect.pipe(Effect.provide(AuditRepoInMemory)));

describe('AuditRepo (contract)', () => {
  it('creates a template and reads it back', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
        const repo = yield* AuditRepo;

        const templateId = yield* repo.createTemplate(sampleAudit);
        const template = yield* repo.getTemplateById(templateId);

        expect(template).not.toBeNull();
        expect(template?.id).toBe(templateId);
        expect(template?.data).toEqual(sampleAudit);
      }),
    ));

  it('creates a run and reads it back', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
        const repo = yield* AuditRepo;

        const templateId = yield* repo.createTemplate(sampleAudit);
        const runId = yield* repo.createRun(templateId);
        const run = yield* repo.getRunById(runId);

        expect(run).not.toBeNull();
        expect(run?.id).toBe(runId);
        expect(run?.templateId).toBe(templateId);
        expect(run?.status).toBe('SCHEDULED');
      }),
    ));

  it('hydrates run details with the submitted audit snapshot', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
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
    ));

  it('claims the next scheduled run and marks it in progress', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
        const repo = yield* AuditRepo;

        const templateId = yield* repo.createTemplate(sampleAudit);
        const runId = yield* repo.createRun(templateId);

        const claimed = yield* repo.claimNextRun();
        expect(claimed?.id).toBe(runId);
        expect(claimed?.status).toBe('IN_PROGRESS');
      }),
    ));

  it('returns null when no scheduled runs exist', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
        const repo = yield* AuditRepo;
        const claimed = yield* repo.claimNextRun();
        expect(claimed).toBeNull();
      }),
    ));

  it('completes a successful run and hydrates result payloads', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
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
    ));

  it('stores completed run durations as integer milliseconds', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
        const repo = yield* AuditRepo;

        const templateId = yield* repo.createTemplate(sampleAudit);
        const runId = yield* repo.createRun(templateId);

        yield* repo.markRunInProgress(runId);
        yield* repo.completeRun(runId, { status: 'SUCCESS', data: { score: 0.91 } }, 42.75);

        const run = yield* repo.getRunById(runId);

        expect(run?.durationMs).toBe(43);
      }),
    ));

  it('stores failure errors', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
        const repo = yield* AuditRepo;
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
      }),
    ));

  it('lists runs newest first with stable ordering', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
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
    ));

  it('paginates with cursor without duplicates or gaps', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
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
    ));

  it('supports status filtering when listing runs', () =>
    runWithInMemoryRepo(
      Effect.gen(function* () {
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
    ));
});
