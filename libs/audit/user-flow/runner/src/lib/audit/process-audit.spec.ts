import { assert, describe, layer } from '@effect/vitest';
import { Cause, Context, Deferred, Effect, Exit, Fiber, Layer, Ref, Result } from 'effect';
import { TestClock } from 'effect/testing';

import { AuditKindSchema } from '@app-speed/audit/core/domain';
import type { AuditClaim } from '@app-speed/audit/core/runner';

import { executeUserFlowAudit } from './process-audit';
import { UserFlowDriver, type UserFlowExecutionResult } from './user-flow-driver';

const claim: AuditClaim = {
  auditId: 'audit-1',
  kind: AuditKindSchema.make('user-flow'),
  definition: {
    title: 'Navigation audit',
    device: 'mobile',
    steps: [{ type: 'customStep', step: 'startNavigation', name: 'Initial navigation' }],
  },
};
const report: UserFlowExecutionResult = {
  flowResult: { name: 'Navigation audit', steps: [] },
  reportHtml: '<html>report</html>',
};
const replayFailure = new Error('net::ERR_NAME_NOT_RESOLVED');
const setupFailure = new Error('flow setup failed');

type Scenario = 'success' | 'replay failure' | 'pending navigation' | 'setup failure' | 'replay and result failure';

class DriverState extends Context.Service<
  DriverState,
  {
    readonly events: Ref.Ref<ReadonlyArray<string>>;
    readonly navigationStarted: Deferred.Deferred<void>;
  }
>()('test/UserFlowDriverState') {
  static readonly layer = Layer.effect(DriverState)(
    Effect.gen(function* () {
      return {
        events: yield* Ref.make<ReadonlyArray<string>>([]),
        navigationStarted: yield* Deferred.make<void>(),
      };
    }),
  );
}

// Each layer invocation owns fresh state; no module mocks or shared test mutation.
const driverLayer = (scenario: Scenario) =>
  Layer.effect(UserFlowDriver)(
    Effect.gen(function* () {
      const state = yield* DriverState;
      const record = (event: string) => Ref.update(state.events, (events) => [...events, event]);

      return {
        start: Effect.fn(function* () {
          yield* Effect.acquireRelease(record('browser opened'), () => record('browser closed'));
          if (scenario === 'setup failure') return yield* Effect.fail(setupFailure);
          return {
            replay: () =>
              Effect.gen(function* () {
                yield* Deferred.succeed(state.navigationStarted, undefined);
                if (scenario === 'replay failure' || scenario === 'replay and result failure')
                  return yield* Effect.fail(replayFailure);
                if (scenario === 'pending navigation') return yield* Effect.never;
              }),
            result:
              scenario === 'replay and result failure'
                ? Effect.die('report unavailable')
                : record('report generated').pipe(Effect.as(report)),
            dispose: record('flow disposed'),
          };
        }),
      };
    }),
  ).pipe(Layer.provideMerge(DriverState.layer));

describe('executeUserFlowAudit resource lifetime', () => {
  layer(driverLayer('success'))('successful replay', (it) => {
    it.effect('produces the report before releasing the flow and browser', () =>
      Effect.gen(function* () {
        const state = yield* DriverState;
        const result = yield* executeUserFlowAudit(claim);

        assert.deepEqual(result, report);
        assert.deepEqual(yield* Ref.get(state.events), [
          'browser opened',
          'report generated',
          'flow disposed',
          'browser closed',
        ]);
      }),
    );
  });

  layer(driverLayer('replay failure'))('failed navigation', (it) => {
    it.effect('preserves completed results on replay failure before releasing resources', () =>
      Effect.gen(function* () {
        const state = yield* DriverState;
        const result = yield* executeUserFlowAudit(claim).pipe(Effect.result);

        assert.isTrue(Result.isFailure(result));
        if (Result.isFailure(result))
          assert.deepEqual(result.failure, {
            name: 'Error',
            message: replayFailure.message,
            partialResult: report.flowResult,
          });
        assert.deepEqual(yield* Ref.get(state.events), [
          'browser opened',
          'report generated',
          'flow disposed',
          'browser closed',
        ]);
      }),
    );
  });

  layer(driverLayer('replay and result failure'))('failed partial recovery', (it) => {
    it.effect('keeps the replay failure when Lighthouse cannot produce a partial report', () =>
      Effect.gen(function* () {
        const state = yield* DriverState;
        const result = yield* executeUserFlowAudit(claim).pipe(Effect.result);
        assert.isTrue(Result.isFailure(result));
        if (Result.isFailure(result))
          assert.deepEqual(result.failure, { name: 'Error', message: replayFailure.message });
        assert.deepEqual(yield* Ref.get(state.events), ['browser opened', 'flow disposed', 'browser closed']);
      }),
    );
  });

  layer(driverLayer('pending navigation'))('interrupted navigation', (it) => {
    it.effect('interrupts pending replay and releases the flow before the browser', () =>
      Effect.gen(function* () {
        const state = yield* DriverState;
        const fiber = yield* executeUserFlowAudit(claim).pipe(Effect.forkChild);
        yield* Deferred.await(state.navigationStarted);
        assert.deepEqual(yield* Ref.get(state.events), ['browser opened']);

        yield* Fiber.interrupt(fiber);
        const exit = yield* Fiber.await(fiber);

        assert.isTrue(Exit.isFailure(exit) && Cause.hasInterruptsOnly(exit.cause));
        assert.deepEqual(yield* Ref.get(state.events), ['browser opened', 'flow disposed', 'browser closed']);
      }),
    );
  });

  layer(driverLayer('pending navigation'))('timed out navigation', (it) => {
    it.effect('returns a timeout error after releasing the pending flow and browser', () =>
      Effect.gen(function* () {
        const state = yield* DriverState;
        const fiber = yield* executeUserFlowAudit(claim).pipe(
          Effect.timeout('1 second'),
          Effect.result,
          Effect.forkChild,
        );
        yield* Deferred.await(state.navigationStarted);
        yield* TestClock.adjust('1 second');
        const result = yield* Fiber.join(fiber);

        assert.isTrue(Result.isFailure(result) && Cause.isTimeoutError(result.failure));
        assert.deepEqual(yield* Ref.get(state.events), ['browser opened', 'flow disposed', 'browser closed']);
      }),
    );
  });

  layer(driverLayer('setup failure'))('failed flow acquisition', (it) => {
    it.effect('preserves the setup error and closes only the acquired browser', () =>
      Effect.gen(function* () {
        const state = yield* DriverState;
        const result = yield* executeUserFlowAudit(claim).pipe(Effect.result);

        assert.isTrue(Result.isFailure(result) && result.failure === setupFailure);
        assert.deepEqual(yield* Ref.get(state.events), ['browser opened', 'browser closed']);
      }),
    );
  });
});
