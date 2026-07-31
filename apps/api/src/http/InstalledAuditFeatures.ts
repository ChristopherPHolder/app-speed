import { Effect, Layer, Match, Schema } from 'effect';

import { InstalledAuditFeatures } from '@app-speed/audit/core/api-runtime';
import { QueryError } from '@app-speed/audit/core/persistence';
import { UserFlowAuditKindSchema } from '@app-speed/audit/user-flow/domain';
import { UserFlowAuditRepo } from '@app-speed/audit/user-flow/persistence';

const UserFlowCompletionSchema = Schema.Struct({
  flowResult: Schema.Unknown,
  reportHtml: Schema.String,
});

export const InstalledAuditFeaturesLive = Layer.effect(
  InstalledAuditFeatures,
  Effect.gen(function* () {
    const userFlowRepo = yield* UserFlowAuditRepo;
    const decodeInstalledKind = (kind: unknown) =>
      Schema.decodeUnknown(UserFlowAuditKindSchema)(kind).pipe(
        Effect.mapError((cause) => new QueryError({ message: 'Unsupported installed audit kind.', cause })),
      );

    return {
      getDefinition: (kind, templateId) =>
        decodeInstalledKind(kind).pipe(
          Effect.flatMap((installedKind) =>
            Match.value(installedKind).pipe(
              Match.when('user-flow', () => userFlowRepo.getDefinition(templateId)),
              Match.exhaustive,
            ),
          ),
          Effect.flatMap((definition) =>
            Effect.fromNullable(definition).pipe(
              Effect.orElseFail(() => new QueryError({ message: 'User-flow definition was not found.' })),
            ),
          ),
        ),
      completeSuccess: (kind, id, result, durationMs) =>
        decodeInstalledKind(kind).pipe(
          Effect.flatMap((installedKind) =>
            Match.value(installedKind).pipe(
              Match.when('user-flow', () =>
                Schema.decodeUnknown(UserFlowCompletionSchema)(result).pipe(
                  Effect.mapError(
                    (cause) => new QueryError({ message: 'Invalid user-flow completion payload.', cause }),
                  ),
                ),
              ),
              Match.exhaustive,
            ),
          ),
          Effect.flatMap((completion) => userFlowRepo.completeSuccess(id, completion, durationMs)),
        ),
    };
  }),
);
