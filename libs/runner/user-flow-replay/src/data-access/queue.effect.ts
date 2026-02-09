import { Config, Effect, Match, Option, Schema } from 'effect';
import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';

export const AuditRequestSchema = Schema.Struct({
  auditId: Schema.String,
  auditDetails: ReplayUserflowAuditSchema,
});

const RunnerClaimResponseSchema = Schema.Union(
  Schema.Struct({ available: Schema.Literal(false) }),
  Schema.Struct({
    available: Schema.Literal(true),
    auditId: Schema.String,
    auditDetails: ReplayUserflowAuditSchema,
  }),
);

const RunnerCompleteResponseSchema = Schema.Struct({ ok: Schema.Literal(true) });

const baseUrlConfig = Config.string('RUNNER_API_BASE_URL').pipe(Config.withDefault('http://localhost:3000/api'));
const runnerIdConfig = Config.string('RUNNER_ID').pipe(Config.option);

const getRunnerId = Effect.gen(function* () {
  const runnerId = yield* runnerIdConfig;
  if (Option.isSome(runnerId)) return runnerId.value;
  return yield* Effect.sync(() => `local-${process.pid}`);
});

export const claimNextAudit = Effect.gen(function* () {
  const baseUrl = yield* baseUrlConfig;
  const apiBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const runnerId = yield* getRunnerId;
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);

  const request = yield* HttpClientRequest.bodyJson({ runnerId })(
    HttpClientRequest.post(new URL('runner/claim', apiBaseUrl).toString()),
  );
  const response = yield* client
    .execute(request)
    .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(RunnerClaimResponseSchema)));

  if (!response.available) return null;
  return { auditId: response.auditId, auditDetails: response.auditDetails } as typeof AuditRequestSchema.Type;
});

export const completeAuditRun = (
  auditId: string,
  result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown },
  durationMs: number,
) =>
  Effect.gen(function* () {
    const baseUrl = yield* baseUrlConfig;
    const apiBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const runnerId = yield* getRunnerId;
    const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);
    const payload = Match.value(result).pipe(
      Match.when({ status: 'SUCCESS' }, (success) => ({
        runnerId,
        auditId,
        status: 'SUCCESS',
        result: success.data,
        durationMs,
      })),
      Match.when({ status: 'FAILURE' }, (failure) => ({
        runnerId,
        auditId,
        status: 'FAILURE',
        error: failure.error,
        durationMs,
      })),
      Match.exhaustive,
    );

    const request = yield* HttpClientRequest.bodyJson(payload)(
      HttpClientRequest.post(new URL('runner/complete', apiBaseUrl).toString()),
    );
    yield* client
      .execute(request)
      .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(RunnerCompleteResponseSchema)));
  });
