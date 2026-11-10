import { Effect, Schema } from 'effect';

import type { AuditClaim } from '@app-speed/audit/core/runner';
import { PuppeteerReplayUserflowRunnerSchema, UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';

import { UserFlowDriver } from './user-flow-driver';

export const executeUserFlowAudit = Effect.fn('executeUserFlowAudit')(function* (claim: AuditClaim) {
  const audit = yield* Schema.decodeUnknownEffect(UserFlowAuditDefinitionSchema)(claim.definition);
  const replayRecording = yield* Schema.decodeUnknownEffect(PuppeteerReplayUserflowRunnerSchema)(audit);
  const driver = yield* UserFlowDriver;
  const session = yield* Effect.acquireRelease(driver.start(audit), (session) => session.dispose);
  yield* session.replay(replayRecording, audit.timeout ?? 30_000).pipe(
    Effect.catch((error) =>
      session.result.pipe(
        Effect.timeout('30 seconds'),
        Effect.catchCause(() => Effect.succeed(undefined)),
        Effect.flatMap((partial) =>
          Effect.fail({
            name: error instanceof Error ? error.name : 'ReplayExecutionError',
            message: error instanceof Error ? error.message : 'Replay failed.',
            ...(error && typeof error === 'object' && 'diagnostics' in error ? { diagnostics: error.diagnostics } : {}),
            ...(partial ? { partialResult: partial.flowResult } : {}),
          }),
        ),
      ),
    ),
  );
  return yield* session.result;
}, Effect.scoped);
