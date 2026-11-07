import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigProvider, Effect, Layer, Schema } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  AuditRepo,
  AuditHistoryRepo,
  AuditRunIdSchema,
  SqliteDbClient,
  SqliteAuditRepoLive,
  SqliteAuditHistoryRepoLive,
  SqliteRecordPersistenceLive,
  RecordPersistenceService,
} from '@app-speed/audit/core/persistence';
import { SqliteUserFlowAuditRepoLive } from './sqlite-repo';
import { SqliteUserFlowAuditSchedulerLive } from './sqlite-scheduler';
import { UserFlowAuditRepo } from './repo';
import { UserFlowAuditScheduler } from './scheduler';

const base = Layer.provideMerge(SqliteRecordPersistenceLive, SqliteDbClient.live);
const repos = Layer.provideMerge(SqliteAuditHistoryRepoLive, Layer.provideMerge(SqliteAuditRepoLive, base));
const live = Layer.provideMerge(
  SqliteUserFlowAuditRepoLive,
  Layer.provideMerge(SqliteUserFlowAuditSchedulerLive, repos),
);
const definition = { title: 'Checkout', device: 'mobile', steps: [] } as const;

describe('SQLite persistence', () => {
  it('persists scheduling, claims, JSON/HTML, failure and filtered history across reopening', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'audit-sqlite-'));
    const run = <A, E>(effect: Effect.Effect<A, E, Layer.Success<typeof live>>) =>
      Effect.runPromise(
        effect.pipe(
          Effect.provide(live),
          Effect.provideService(
            ConfigProvider.ConfigProvider,
            ConfigProvider.fromUnknown({ SQLITE_PATH: join(directory, 'audit.sqlite') }),
          ),
        ),
      );
    try {
      const id = await run(
        Effect.gen(function* () {
          const scheduler = yield* UserFlowAuditScheduler;
          const repo = yield* AuditRepo;
          const userFlow = yield* UserFlowAuditRepo;
          const first = yield* scheduler.schedule(definition);
          const second = yield* scheduler.schedule({ ...definition, title: 'Second' });
          expect(yield* repo.getQueuePosition(second)).toBe(1);
          expect((yield* repo.claimNextRun())?.id).toBe(first);
          const saved = yield* repo.getRunById(first);
          if (!saved) throw new Error('Scheduled run missing');
          expect(yield* userFlow.getDefinition(saved.templateId)).toEqual(definition);
          yield* userFlow.completeSuccess(first, { flowResult: { score: 0.93 }, reportHtml: '<h1>report</h1>' }, 123.4);
          const duplicate = yield* Effect.exit(
            userFlow.completeSuccess(first, { flowResult: { overwritten: true }, reportHtml: 'wrong' }, 1),
          );
          expect(duplicate._tag).toBe('Failure');
          expect((yield* repo.claimNextRun())?.id).toBe(second);
          yield* repo.completeFailure(second, { message: 'failure' }, 50);
          expect(yield* repo.claimNextRun()).toBeNull();
          const scheduled = yield* Effect.forEach(Array.from({ length: 8 }), () => scheduler.schedule(definition));
          const claimed = yield* Effect.all(
            Array.from({ length: 8 }, () => repo.claimNextRun()),
            { concurrency: 'unbounded' },
          );
          expect(new Set(claimed.map((run) => run?.id)).size).toBe(8);
          expect(claimed.every((run) => run && scheduled.includes(run.id))).toBe(true);
          return first;
        }),
      );
      await run(
        Effect.gen(function* () {
          const repo = yield* UserFlowAuditRepo;
          expect(yield* repo.getResultByRunId(id)).toEqual({
            status: 'SUCCESS',
            flowResult: { score: 0.93 },
            reportHtml: '<h1>report</h1>',
          });
          const history = yield* AuditHistoryRepo;
          const page = yield* history.listRunsPage({
            search: 'check',
            outcome: 'SUCCESS',
            limit: 1,
            cursor: null,
            status: null,
            kind: null,
          });
          expect(page.items.map((item) => item.id)).toEqual([id]);
          const missing = yield* Schema.decodeUnknownEffect(AuditRunIdSchema)('missing');
          expect(yield* repo.getResultByRunId(missing)).toBeNull();
          const records = yield* RecordPersistenceService;
          expect(yield* records.get(records.makeRecordKey('missing-record'))).toBeNull();
          const key = records.makeRecordKey('overwrite');
          yield* records.put(key, 'old');
          yield* records.put(key, 'new');
          expect(yield* records.get(key)).toBe('new');
        }),
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
