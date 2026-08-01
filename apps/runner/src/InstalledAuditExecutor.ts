import { Effect, Layer, Match, Schema } from 'effect';

import { AuditExecutor } from '@app-speed/audit/core/runner';
import { UserFlowAuditKindSchema } from '@app-speed/audit/user-flow/domain';
import { executeUserFlowAudit } from '@app-speed/audit/user-flow/runner';

export const InstalledAuditExecutorLive = Layer.succeed(AuditExecutor)({
  execute: (claim) =>
    Schema.decodeUnknownEffect(UserFlowAuditKindSchema)(claim.kind).pipe(
      Effect.flatMap((kind) =>
        Match.value(kind).pipe(
          Match.when('user-flow', () => executeUserFlowAudit(claim)),
          Match.exhaustive,
        ),
      ),
    ),
});
