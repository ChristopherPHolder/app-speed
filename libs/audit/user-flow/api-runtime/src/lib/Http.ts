import { HttpServerResponse } from 'effect/unstable/http';
import { HttpApiBuilder, HttpApiError } from 'effect/unstable/httpapi';
import { Duration, Effect, Schedule, Stream } from 'effect';

import { AuditNotFoundError } from '@app-speed/audit/core/api-contract';
import { historyHandler, RunnerLifecycle } from '@app-speed/audit/core/api-runtime';
import { AuditRepo, type AuditRunId } from '@app-speed/audit/core/persistence';
import { UserFlowApi } from '@app-speed/audit/user-flow/api-contract';
import { USER_FLOW_AUDIT_KIND, USER_FLOW_AUDIT_KIND_LITERAL } from '@app-speed/audit/user-flow/domain';
import { UserFlowAuditRepo, UserFlowAuditScheduler } from '@app-speed/audit/user-flow/persistence';

type AuditSnapshot = {
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
  position: number;
  resultStatus: 'SUCCESS' | 'FAILURE' | null;
};

type AuditSseEvent =
  | { event: 'position'; data: { auditId: string; position: number } }
  | { event: 'status'; data: { auditId: string; status: AuditSnapshot['status'] } }
  | { event: 'result'; data: { auditId: string; status: 'SUCCESS' | 'FAILURE' } }
  | { event: 'heartbeat'; data: { auditId: string } };

const encoder = new TextEncoder();
const encodeSse = (event: AuditSseEvent) =>
  encoder.encode(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);

const normalizeError = (error: unknown) => {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return {
      name: typeof record['name'] === 'string' ? record['name'] : 'Error',
      message: typeof record['message'] === 'string' ? record['message'] : 'Unknown error',
      stack: typeof record['stack'] === 'string' ? record['stack'] : '',
    };
  }
  return { name: 'Error', message: typeof error === 'string' ? error : 'Unknown error', stack: '' };
};

const requireUserFlowRun = (id: AuditRunId) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;
    const run = yield* repo.getRunById(id);
    if (run === null || run.kind !== USER_FLOW_AUDIT_KIND_LITERAL) {
      return yield* new AuditNotFoundError({ id });
    }
    return run;
  });

export const UserFlowAuditGroupLive = HttpApiBuilder.group(UserFlowApi, 'userFlowAudit', (handlers) =>
  Effect.gen(function* () {
    const scheduler = yield* UserFlowAuditScheduler;
    const repo = yield* AuditRepo;
    const userFlowRepo = yield* UserFlowAuditRepo;
    const runnerLifecycle = yield* RunnerLifecycle;

    return handlers
      .handle(
        'scheduleUserFlowAudit',
        Effect.fn('api.userFlowAudit.schedule')((request) =>
          Effect.gen(function* () {
            const auditId = yield* scheduler.schedule(request.payload);
            const auditQueuePosition = yield* repo.getQueuePosition(auditId);
            yield* runnerLifecycle.requestActivation;
            return { auditId, auditQueuePosition: auditQueuePosition ?? 0 };
          }).pipe(
            Effect.withSpan('api.userFlowAudit.schedule'),
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'findById',
        Effect.fn('api.userFlowAudit.findById')((request) =>
          requireUserFlowRun(request.params.id).pipe(
            Effect.map((run) => ({ status: run.status })),
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('SchemaError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'watchById',
        Effect.fn('api.userFlowAudit.watchById')((request) =>
          Effect.gen(function* () {
            const auditId = request.params.id;
            yield* requireUserFlowRun(auditId);
            const snapshot = Effect.gen(function* () {
              const run = yield* requireUserFlowRun(auditId);
              const position = yield* repo.getQueuePosition(auditId);
              const result = run.status === 'COMPLETE' ? yield* repo.getResultByRunId(auditId) : null;
              return {
                status: run.status,
                position: position ?? 0,
                resultStatus: result?.status ?? null,
              } satisfies AuditSnapshot;
            });
            const stream = Stream.fromEffectSchedule(snapshot, Schedule.fixed(Duration.seconds(1))).pipe(
              Stream.mapAccum(
                (): AuditSnapshot | null => null,
                (previous, next) => {
                  const events: AuditSseEvent[] = [];
                  if (!previous || next.position !== previous.position) {
                    events.push({ event: 'position', data: { auditId, position: next.position } });
                  }
                  if (!previous || next.status !== previous.status) {
                    events.push({ event: 'status', data: { auditId, status: next.status } });
                  }
                  if (next.resultStatus && (!previous || next.resultStatus !== previous.resultStatus)) {
                    events.push({ event: 'result', data: { auditId, status: next.resultStatus } });
                  }
                  if (events.length === 0) events.push({ event: 'heartbeat', data: { auditId } });
                  return [next, events];
                },
              ),
              Stream.takeUntil((event) => event.event === 'result'),
              Stream.map(encodeSse),
              Stream.provideService(AuditRepo, repo),
            );
            return HttpServerResponse.stream(stream, {
              contentType: 'text/event-stream',
              headers: { 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
            });
          }).pipe(
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('SchemaError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'resultById',
        Effect.fn('api.userFlowAudit.resultById')((request) =>
          Effect.gen(function* () {
            yield* requireUserFlowRun(request.params.id);
            const result = yield* userFlowRepo.getResultByRunId(request.params.id);
            if (result === null) return yield* new HttpApiError.NotFound();
            return result.status === 'SUCCESS'
              ? ({ status: 'SUCCESS', result: result.flowResult } as const)
              : ({ status: 'FAILURE', error: normalizeError(result.error) } as const);
          }).pipe(
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('SchemaError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'reportById',
        Effect.fn('api.userFlowAudit.reportById')((request) =>
          Effect.gen(function* () {
            yield* requireUserFlowRun(request.params.id);
            const result = yield* userFlowRepo.getResultByRunId(request.params.id);
            if (result === null || result.status !== 'SUCCESS') return yield* new HttpApiError.NotFound();
            return result.reportHtml;
          }).pipe(
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('SchemaError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle('history', historyHandler(USER_FLOW_AUDIT_KIND));
  }),
);
