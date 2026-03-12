import { Cause, Clock, Config, Duration, Effect, Exit, Option, Ref } from 'effect';
import {
  type AuditRequest,
  claimNextAudit,
  completeAuditRun,
  requestRunnerTermination,
  sendRunnerHeartbeat,
} from './data-access/queue.effect';
import { processAudit } from './process-audit';

const toErrorPayload = (cause: Cause.Cause<unknown>) => {
  const failure = Cause.failureOption(cause);
  if (Option.isSome(failure)) {
    const error = failure.value;
    if (error instanceof Error) {
      return { name: error.name, message: error.message, stack: error.stack ?? '' };
    }
    if (typeof error === 'string') {
      return { name: 'Error', message: error, stack: '' };
    }
    if (error && typeof error === 'object') {
      const record = error as Record<string, unknown>;
      return {
        name: typeof record['name'] === 'string' ? record['name'] : 'Error',
        message: typeof record['message'] === 'string' ? record['message'] : Cause.pretty(cause),
        stack: typeof record['stack'] === 'string' ? record['stack'] : '',
      };
    }
  }

  return { name: 'Error', message: Cause.pretty(cause), stack: '' };
};

const runnerIdleTimeoutMsConfig = Config.integer('RUNNER_IDLE_TIMEOUT_MS').pipe(Config.withDefault(60_000));
const runnerIdlePollIntervalMsConfig = Config.integer('RUNNER_IDLE_POLL_INTERVAL_MS').pipe(Config.withDefault(5_000));
const runnerHeartbeatIntervalMsConfig = Config.integer('RUNNER_HEARTBEAT_INTERVAL_MS').pipe(Config.withDefault(15_000));

type QueueState =
  | {
      state: 'BUSY';
      idleSince: null;
    }
  | {
      state: 'IDLE';
      idleSince: number;
    };

const setBusyState = (stateRef: Ref.Ref<QueueState>) =>
  Ref.set(stateRef, {
    state: 'BUSY',
    idleSince: null,
  });

const setIdleState = (stateRef: Ref.Ref<QueueState>, idleSince: number) =>
  Ref.set(stateRef, {
    state: 'IDLE',
    idleSince,
  });

const processAuditRequest = Effect.fn('runner.queue.processItem')(function* (
  auditRequest: AuditRequest,
  stateRef: Ref.Ref<QueueState>,
) {
  yield* setBusyState(stateRef);
  yield* Effect.annotateCurrentSpan({ 'audit.id': auditRequest.auditId });
  const [duration, exit] = yield* Effect.timed(Effect.exit(processAudit(auditRequest)));
  const durationMs = Duration.toMillis(duration);
  yield* Effect.annotateCurrentSpan({ 'audit.duration_ms': durationMs });

  if (Exit.isSuccess(exit)) {
    yield* Effect.annotateCurrentSpan({ 'audit.status': 'SUCCESS' });
    yield* completeAuditRun(auditRequest.auditId, { status: 'SUCCESS', data: exit.value }, durationMs);
  } else {
    const error = toErrorPayload(exit.cause);
    yield* Effect.annotateCurrentSpan({
      'audit.status': 'FAILURE',
      'error.name': error.name,
    });
    yield* completeAuditRun(auditRequest.auditId, { status: 'FAILURE', data: null, error }, durationMs);
  }

  yield* Effect.log(`Completed processing ${auditRequest.auditId}`);
});

const heartbeatLoop = (stateRef: Ref.Ref<QueueState>, heartbeatIntervalMs: number) =>
  Effect.forever(
    Effect.gen(function* () {
      const state = yield* Ref.get(stateRef);
      yield* sendRunnerHeartbeat({
        state: state.state,
        idleSince: state.idleSince,
      }).pipe(Effect.catchAll((error) => Effect.logWarning(`Runner heartbeat failed: ${String(error)}`)));
      yield* Effect.sleep(Duration.millis(heartbeatIntervalMs));
    }),
  ).pipe(Effect.withSpan('runner.queue.heartbeatLoop'));

const queueLoop = Effect.fn('runner.queue.loop')(function* (
  stateRef: Ref.Ref<QueueState>,
  idleTimeoutMs: number,
  idlePollIntervalMs: number,
) {
  while (true) {
    const auditRequest = yield* claimNextAudit;
    if (auditRequest !== null) {
      yield* processAuditRequest(auditRequest, stateRef);
      continue;
    }

    const nowMs = yield* Clock.currentTimeMillis;
    const currentState = yield* Ref.get(stateRef);
    const idleSince = currentState.state === 'IDLE' ? currentState.idleSince : nowMs;
    yield* setIdleState(stateRef, idleSince);

    const idleDurationMs = nowMs - idleSince;
    yield* Effect.annotateCurrentSpan({
      'runner.idle_since': idleSince,
      'runner.idle_duration_ms': idleDurationMs,
      'runner.idle_timeout_ms': idleTimeoutMs,
    });

    if (idleDurationMs >= idleTimeoutMs) {
      yield* Effect.logInfo(`Runner idle for ${idleDurationMs}ms, requesting termination`);
      const shouldTerminate = yield* requestRunnerTermination('IDLE_TIMEOUT');
      if (shouldTerminate) {
        return;
      }

      yield* Effect.logInfo('Runner shutdown request was rejected because work is pending; continuing to poll');
      continue;
    }

    yield* Effect.sleep(Duration.millis(idlePollIntervalMs));
  }
});

export const processQueue = Effect.gen(function* () {
  const idleTimeoutMs = yield* runnerIdleTimeoutMsConfig;
  const idlePollIntervalMs = yield* runnerIdlePollIntervalMsConfig;
  const heartbeatIntervalMs = yield* runnerHeartbeatIntervalMsConfig;
  const stateRef = yield* Ref.make<QueueState>({
    state: 'BUSY',
    idleSince: null,
  });

  yield* Effect.forkScoped(heartbeatLoop(stateRef, heartbeatIntervalMs));
  yield* queueLoop(stateRef, idleTimeoutMs, idlePollIntervalMs);
}).pipe(Effect.withSpan('runner.queue.runtime'), Effect.scoped);
