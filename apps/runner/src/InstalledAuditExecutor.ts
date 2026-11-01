import { Effect, Layer, Match, Schema } from 'effect';

import { AuditExecutor } from '@app-speed/audit/core/runner';
import { UserFlowAuditKindSchema } from '@app-speed/audit/user-flow/domain';
import { executeUserFlowAudit, UserFlowDriver } from '@app-speed/audit/user-flow/runner';

export const InstalledAuditExecutorLive = Layer.effect(AuditExecutor)(
  Effect.gen(function* () {
    const driver = yield* UserFlowDriver;
    return {
      execute: (claim) =>
        Schema.decodeUnknownEffect(UserFlowAuditKindSchema)(claim.kind).pipe(
          Effect.flatMap((kind) =>
            Match.value(kind).pipe(
              Match.when('user-flow', () => executeUserFlowAudit(claim)),
              Match.exhaustive,
            ),
          ),
          Effect.provideService(UserFlowDriver, driver),
        ),
    };
  }),
).pipe(Layer.provide(UserFlowDriver.layer));
