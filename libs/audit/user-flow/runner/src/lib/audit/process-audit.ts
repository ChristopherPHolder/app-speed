import { Effect, Schema } from 'effect';

import type { AuditClaim } from '@app-speed/audit/core/runner';
import { PuppeteerReplayUserflowRunnerSchema, UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';

import { UserFlowDriver } from './user-flow-driver';

export const executeUserFlowAudit = Effect.fn('executeUserFlowAudit')(function* (claim: AuditClaim) {
  const audit = yield* Schema.decodeUnknownEffect(UserFlowAuditDefinitionSchema)(claim.definition);
  const replayRecording = yield* Schema.decodeUnknownEffect(PuppeteerReplayUserflowRunnerSchema)(audit);
  const driver = yield* UserFlowDriver;
  const session = yield* Effect.acquireRelease(driver.start(audit), (session) => session.dispose);
  yield* session.replay(replayRecording, audit.timeout ?? 30_000);
  return yield* session.result;
}, Effect.scoped);
