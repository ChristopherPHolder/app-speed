import { EC2Client, StopInstancesCommand } from '@aws-sdk/client-ec2';
import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Clock, Config, Effect, Match, Option, Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';

export const AuditRequestSchema = Schema.Struct({
  auditId: Schema.String,
  auditDetails: ReplayUserflowAuditSchema,
});
export type AuditRequest = typeof AuditRequestSchema.Type;

const RunnerClaimResponseSchema = Schema.Union(
  Schema.Struct({ available: Schema.Literal(false) }),
  Schema.Struct({
    available: Schema.Literal(true),
    auditId: Schema.String,
    auditDetails: ReplayUserflowAuditSchema,
  }),
);

const RunnerCompleteResponseSchema = Schema.Struct({ ok: Schema.Literal(true) });
const RunnerHeartbeatResponseSchema = Schema.Struct({ ok: Schema.Literal(true) });
const RunnerShutdownResponseSchema = Schema.Struct({
  ok: Schema.Literal(true),
  shouldTerminate: Schema.Boolean,
});
const RunnerHeartbeatStateSchema = Schema.Literal('BUSY', 'IDLE');
const RunnerShutdownReasonSchema = Schema.Literal('IDLE_TIMEOUT');

const baseUrlConfig = Config.string('RUNNER_API_BASE_URL').pipe(Config.withDefault('http://localhost:3000/api'));
const runnerIdConfig = Config.string('RUNNER_ID').pipe(Config.option);
const runnerEc2RegionConfig = Config.string('RUNNER_EC2_REGION').pipe(Config.option);
const awsRegionConfig = Config.string('AWS_REGION').pipe(Config.option);
const awsDefaultRegionConfig = Config.string('AWS_DEFAULT_REGION').pipe(Config.option);

type RunnerHeartbeatState = typeof RunnerHeartbeatStateSchema.Type;
type RunnerShutdownReason = typeof RunnerShutdownReasonSchema.Type;

let cachedRunnerId: string | undefined;

const getRunnerId = Effect.gen(function* () {
  if (cachedRunnerId) {
    return cachedRunnerId;
  }

  const runnerId = yield* runnerIdConfig;
  const resolvedRunnerId = Option.match(runnerId, {
    onNone: () => `local-${process.pid}`,
    onSome: (value) => value,
  });

  cachedRunnerId = resolvedRunnerId;
  return resolvedRunnerId;
});

const getApiBaseUrl = Effect.gen(function* () {
  const baseUrl = yield* baseUrlConfig;
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
});

const getHttpClient = Effect.gen(function* () {
  return (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);
});

const parseManagedEc2InstanceId = (runnerId: string): Option.Option<string> => {
  const matched = /^ec2-(i-[a-z0-9]+)$/.exec(runnerId);
  return matched ? Option.some(matched[1]) : Option.none();
};

const getRunnerEc2Region = Effect.gen(function* () {
  const explicitRegion = yield* runnerEc2RegionConfig;
  if (Option.isSome(explicitRegion)) {
    return Option.some(explicitRegion.value);
  }

  const awsRegion = yield* awsRegionConfig;
  if (Option.isSome(awsRegion)) {
    return Option.some(awsRegion.value);
  }

  return yield* awsDefaultRegionConfig;
});

export const claimNextAudit = Effect.gen(function* () {
  const apiBaseUrl = yield* getApiBaseUrl;
  const runnerId = yield* getRunnerId;
  yield* Effect.annotateCurrentSpan({
    'runner.id': runnerId,
    'runner.api_base_url': apiBaseUrl,
  });
  const client = yield* getHttpClient;

  const request = yield* HttpClientRequest.bodyJson({ runnerId })(
    HttpClientRequest.post(new URL('runner/claim', apiBaseUrl).toString()),
  );
  const response = yield* client
    .execute(request)
    .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(RunnerClaimResponseSchema)));

  if (!response.available) {
    yield* Effect.annotateCurrentSpan({ 'runner.claim_available': false });
    return null;
  }
  yield* Effect.annotateCurrentSpan({
    'runner.claim_available': true,
    'audit.id': response.auditId,
  });
  return { auditId: response.auditId, auditDetails: response.auditDetails } as AuditRequest;
}).pipe(Effect.withSpan('runner.queue.claimNext'));

export const completeAuditRun = (
  auditId: string,
  result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown },
  durationMs: number,
) =>
  Effect.gen(function* () {
    const apiBaseUrl = yield* getApiBaseUrl;
    const runnerId = yield* getRunnerId;
    yield* Effect.annotateCurrentSpan({
      'runner.id': runnerId,
      'audit.id': auditId,
      'audit.status': result.status,
      'audit.duration_ms': durationMs,
      'runner.api_base_url': apiBaseUrl,
    });
    const client = yield* getHttpClient;
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
  }).pipe(Effect.withSpan('runner.queue.completeRun'));

export const sendRunnerHeartbeat = (payload: { state: RunnerHeartbeatState; idleSince?: number | null }) =>
  Effect.gen(function* () {
    const apiBaseUrl = yield* getApiBaseUrl;
    const runnerId = yield* getRunnerId;
    const timestamp = yield* Clock.currentTimeMillis;
    const client = yield* getHttpClient;

    yield* Effect.annotateCurrentSpan({
      'runner.id': runnerId,
      'runner.heartbeat_state': payload.state,
      'runner.idle_since': payload.idleSince ?? null,
    });

    const request = yield* HttpClientRequest.bodyJson({
      runnerId,
      timestamp,
      state: payload.state,
      ...(payload.idleSince !== null && payload.idleSince !== undefined ? { idleSince: payload.idleSince } : {}),
    })(HttpClientRequest.post(new URL('runner/heartbeat', apiBaseUrl).toString()));

    yield* client
      .execute(request)
      .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(RunnerHeartbeatResponseSchema)));
  }).pipe(Effect.withSpan('runner.queue.heartbeat'));

export const requestRunnerShutdown = (reason: RunnerShutdownReason) =>
  Effect.gen(function* () {
    const apiBaseUrl = yield* getApiBaseUrl;
    const runnerId = yield* getRunnerId;
    const timestamp = yield* Clock.currentTimeMillis;
    const client = yield* getHttpClient;

    yield* Effect.annotateCurrentSpan({
      'runner.id': runnerId,
      'runner.shutdown_reason': reason,
    });

    const request = yield* HttpClientRequest.bodyJson({
      runnerId,
      reason,
      timestamp,
    })(HttpClientRequest.post(new URL('runner/shutdown', apiBaseUrl).toString()));

    return yield* client
      .execute(request)
      .pipe(Effect.flatMap(HttpClientResponse.schemaBodyJson(RunnerShutdownResponseSchema)));
  }).pipe(Effect.withSpan('runner.queue.shutdownRequest'));

const stopSelfEc2Instance = Effect.gen(function* () {
  const runnerId = yield* getRunnerId;
  const maybeInstanceId = parseManagedEc2InstanceId(runnerId);

  if (Option.isNone(maybeInstanceId)) {
    return;
  }

  const region = yield* getRunnerEc2Region;
  if (Option.isNone(region)) {
    yield* Effect.logWarning(`Skipping EC2 self-termination for ${runnerId}: missing AWS region`);
    return;
  }

  yield* Effect.annotateCurrentSpan({
    'runner.id': runnerId,
    'runner.aws.instance_id': maybeInstanceId.value,
    'runner.aws.region': region.value,
  });

  const client = new EC2Client({ region: region.value });
  yield* Effect.tryPromise({
    try: () => client.send(new StopInstancesCommand({ InstanceIds: [maybeInstanceId.value] })),
    catch: (error) => new Error(`Failed to stop EC2 instance ${maybeInstanceId.value}: ${String(error)}`),
  });
}).pipe(Effect.withSpan('runner.queue.selfTerminateEc2'));

export const requestRunnerTermination = (reason: RunnerShutdownReason) =>
  Effect.gen(function* () {
    const shutdownDecision = yield* requestRunnerShutdown(reason).pipe(
      Effect.map((response) => Option.some(response.shouldTerminate)),
      Effect.catchAll((error) =>
        Effect.logWarning(`Runner shutdown request failed: ${String(error)}`).pipe(Effect.as(Option.none<boolean>())),
      ),
    );

    if (Option.isSome(shutdownDecision)) {
      return shutdownDecision.value;
    }

    yield* stopSelfEc2Instance.pipe(
      Effect.catchAll((error) => Effect.logWarning(`Runner EC2 self-termination failed: ${String(error)}`)),
    );
    return true;
  }).pipe(Effect.withSpan('runner.queue.terminate'));
