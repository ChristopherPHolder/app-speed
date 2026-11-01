import { assert, it } from '@effect/vitest';
import { beforeEach, describe, vi } from 'vitest';
import { Deferred, Effect, Exit, Fiber, Result } from 'effect';
import { TestClock } from 'effect/testing';
import type { AuditClaim } from '@app-speed/audit/core/runner';
import { AuditKindSchema } from '@app-speed/audit/core/domain';

import { executeUserFlowAudit } from './process-audit';

const mocks = vi.hoisted(() => ({
  startFlow: vi.fn(),
  dispose: vi.fn(),
  createFlowResult: vi.fn(),
  generateReport: vi.fn(),
  runnerContext: vi.fn(),
  replay: vi.fn(),
}));

vi.mock('lighthouse', () => ({
  startFlow: mocks.startFlow,
  generateReport: mocks.generateReport,
}));
vi.mock('@app-speed/audit/core/runner', () => ({
  RunnerContext: mocks.runnerContext,
  runPuppeteerReplay: mocks.replay,
}));
vi.mock('./audit-config', () => ({ AuditConfig: () => Effect.succeed({ lighthousePreset: {} }) }));
vi.mock('./runner-extension', () => ({ UserFlowRunnerExtension: class {} }));

const claim: AuditClaim = {
  auditId: 'audit-1',
  kind: AuditKindSchema.make('user-flow'),
  definition: {
    title: 'Navigation audit',
    device: 'mobile',
    steps: [{ type: 'customStep', step: 'startNavigation', name: 'Initial navigation' }],
  },
};

describe('executeUserFlowAudit cleanup', () => {
  let events: string[];

  beforeEach(() => {
    vi.resetAllMocks();
    events = [];
    mocks.runnerContext.mockImplementation(() =>
      Effect.acquireRelease(Effect.succeed({ browser: {}, page: {} }), () =>
        Effect.sync(() => {
          events.push('browser closed');
        }),
      ),
    );
    mocks.startFlow.mockResolvedValue({ dispose: mocks.dispose, createFlowResult: mocks.createFlowResult });
    mocks.dispose.mockImplementation(() => {
      events.push('flow disposed');
    });
    mocks.createFlowResult.mockResolvedValue({ name: 'Navigation audit', steps: [] });
    mocks.generateReport.mockImplementation(() => {
      events.push('report generated');
      return '<html>report</html>';
    });
    mocks.replay.mockReturnValue(Effect.void);
  });

  it.effect('generates the result before disposing the flow and closing the browser', () =>
    Effect.gen(function* () {
      const result = yield* executeUserFlowAudit(claim);

      assert.deepEqual(result, {
        flowResult: { name: 'Navigation audit', steps: [] },
        reportHtml: '<html>report</html>',
      });
      assert.deepEqual(events, ['report generated', 'flow disposed', 'browser closed']);
      assert.strictEqual(mocks.dispose.mock.calls.length, 1);
    }),
  );

  it.effect('preserves the replay failure and disposes before browser teardown', () =>
    Effect.gen(function* () {
      const failure = new Error('net::ERR_NAME_NOT_RESOLVED');
      mocks.replay.mockReturnValue(Effect.fail(failure));

      const result = yield* executeUserFlowAudit(claim).pipe(Effect.result);

      assert.isTrue(Result.isFailure(result));
      if (Result.isFailure(result)) assert.strictEqual(result.failure, failure);
      assert.deepEqual(events, ['flow disposed', 'browser closed']);
      assert.strictEqual(mocks.createFlowResult.mock.calls.length, 0);
    }),
  );

  it.effect('disposes an active flow when execution is interrupted', () =>
    Effect.gen(function* () {
      const started = yield* Deferred.make<void>();
      mocks.replay.mockReturnValue(Deferred.succeed(started, undefined).pipe(Effect.andThen(Effect.never)));
      const fiber = yield* executeUserFlowAudit(claim).pipe(Effect.forkChild);
      yield* Deferred.await(started);

      yield* Fiber.interrupt(fiber);
      const exit = yield* Fiber.await(fiber);

      assert.isTrue(Exit.isFailure(exit));
      assert.deepEqual(events, ['flow disposed', 'browser closed']);
      assert.strictEqual(mocks.createFlowResult.mock.calls.length, 0);
    }),
  );

  it.effect('disposes an active flow when execution times out', () =>
    Effect.gen(function* () {
      const started = yield* Deferred.make<void>();
      mocks.replay.mockReturnValue(Deferred.succeed(started, undefined).pipe(Effect.andThen(Effect.never)));
      const fiber = yield* executeUserFlowAudit(claim).pipe(Effect.timeout('1 second'), Effect.exit, Effect.forkChild);
      yield* Deferred.await(started);
      yield* TestClock.adjust('1 second');
      const exit = yield* Fiber.join(fiber);

      assert.isTrue(Exit.isFailure(exit));
      assert.deepEqual(events, ['flow disposed', 'browser closed']);
    }),
  );

  it.effect('closes the browser if flow creation fails without trying to dispose an uncreated flow', () =>
    Effect.gen(function* () {
      mocks.startFlow.mockRejectedValue(new Error('flow setup failed'));

      const exit = yield* executeUserFlowAudit(claim).pipe(Effect.exit);

      assert.isTrue(Exit.isFailure(exit));
      assert.deepEqual(events, ['browser closed']);
      assert.strictEqual(mocks.dispose.mock.calls.length, 0);
    }),
  );
});
