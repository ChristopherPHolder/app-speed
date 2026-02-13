import { HttpApiBuilder, HttpApiError, HttpServerResponse } from '@effect/platform';
import { Api } from '../Api.js';
import { Duration, Effect, Schedule, Stream } from 'effect';
import { AuditRepo } from '@app-speed/server/db';
import { AuditNotFoundError } from './Audit';
import { RunnerManager } from '../Runner/RunnerManager.js';

type AuditSnapshot = {
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
  position: number;
  resultStatus: 'SUCCESS' | 'FAILURE' | null;
};

type AuditSseEvent =
  | { event: 'position'; data: { auditId: string; position: number } }
  | { event: 'status'; data: { auditId: string; status: AuditSnapshot['status'] } }
  | { event: 'result'; data: { auditId: string; status: 'SUCCESS' | 'FAILURE' } };

const encoder = new TextEncoder();
const encodeSse = (event: AuditSseEvent) =>
  encoder.encode(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);

const normalizeError = (error: unknown) => {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return {
      name: typeof record.name === 'string' ? record.name : 'Error',
      message: typeof record.message === 'string' ? record.message : 'Unknown error',
      stack: typeof record.stack === 'string' ? record.stack : '',
    };
  }
  if (typeof error === 'string') {
    return { name: 'Error', message: error, stack: '' };
  }
  return { name: 'Error', message: 'Unknown error', stack: '' };
};

const toSuccessResult = (result: unknown) => ({ status: 'SUCCESS', result }) as const;
const toFailureResult = (error: { name: string; message: string; stack: string }) =>
  ({ status: 'FAILURE', error }) as const;

export const AuditGroupLive = HttpApiBuilder.group(Api, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    const repo = yield* AuditRepo;

    return handlers
      .handle(
        'findById',
        Effect.fn('api.audit.findById')((request) =>
          repo.getRunById(request.path.id).pipe(
            Effect.tap(() => Effect.annotateCurrentSpan({ 'audit.id': request.path.id })),
            Effect.filterOrFail(
              (r) => r !== null,
              () => new AuditNotFoundError({ id: request.path.id }),
            ),
            Effect.tap((audit) => Effect.annotateCurrentSpan({ 'audit.status': audit.status })),
            Effect.map((audit) => ({ status: audit.status })),
            Effect.withSpan('api.audit.findById'),
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'resultById',
        Effect.fn('api.audit.resultById')((request) =>
          repo.getRunById(request.path.id).pipe(
            Effect.tap(() => Effect.annotateCurrentSpan({ 'audit.id': request.path.id })),
            Effect.filterOrFail(
              (r) => r !== null,
              () => new AuditNotFoundError({ id: request.path.id }),
            ),
            Effect.flatMap(() => repo.getResultByRunId(request.path.id)),
            Effect.filterOrFail(
              (r) => r !== null,
              () => new HttpApiError.NotFound(),
            ),

            Effect.map((result) =>
              result.status === 'SUCCESS'
                ? toSuccessResult(result.data)
                : toFailureResult(normalizeError(result.error)),
            ),
            Effect.tap((result) => Effect.annotateCurrentSpan({ 'audit.result_status': result.status })),
            Effect.withSpan('api.audit.resultById'),
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'schedule',
        Effect.fn('api.audit.schedule')((request) =>
          Effect.gen(function* () {
            yield* Effect.annotateCurrentSpan({
              'audit.title': request.payload.title,
              'audit.device': request.payload.device,
            });
            const templateId = yield* repo.createTemplate(request.payload);
            const runnerManager = yield* RunnerManager;
            const auditId = yield* repo.createRun(templateId);
            const auditQueuePosition = yield* repo.getQueuePosition(auditId);
            yield* runnerManager.ensureRunnerActive;
            yield* Effect.annotateCurrentSpan({
              'audit.id': auditId,
              'queue.position': auditQueuePosition ?? 0,
            });
            return { auditId, auditQueuePosition: auditQueuePosition ?? 0 };
          }).pipe(
            Effect.withSpan('api.audit.schedule'),
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'watchById',
        Effect.fn('api.audit.watchById')((request) =>
          Effect.gen(function* () {
            const auditId = request.path.id;
            yield* Effect.annotateCurrentSpan({
              'audit.id': auditId,
              'poll.interval_ms': Duration.toMillis(Duration.seconds(1)),
            });
            yield* repo.getRunById(auditId).pipe(
              Effect.filterOrFail(
                (r) => r !== null,
                () => new AuditNotFoundError({ id: auditId }),
              ),
            );

            const snapshot = Effect.gen(function* () {
              const run = yield* repo.getRunById(auditId).pipe(
                Effect.filterOrFail(
                  (r) => r !== null,
                  () => new AuditNotFoundError({ id: auditId }),
                ),
              );
              const position = yield* repo.getQueuePosition(auditId);
              const result = run.status === 'COMPLETE' ? yield* repo.getResultByRunId(auditId) : null;
              yield* Effect.annotateCurrentSpan({
                'audit.id': auditId,
                'audit.status': run.status,
                'queue.position': position ?? 0,
                'audit.result_status': result?.status ?? null,
              });
              return {
                status: run.status,
                position: position ?? 0,
                resultStatus: result?.status ?? null,
              } satisfies AuditSnapshot;
            }).pipe(Effect.withSpan('api.audit.watchById.tick'));

            const stream = Stream.repeatEffectWithSchedule(snapshot, Schedule.fixed(Duration.seconds(1))).pipe(
              Stream.mapAccum(null as AuditSnapshot | null, (prev, next) => {
                const events: AuditSseEvent[] = [];
                if (!prev || next.position !== prev.position) {
                  events.push({ event: 'position', data: { auditId, position: next.position } });
                }
                if (!prev || next.status !== prev.status) {
                  events.push({ event: 'status', data: { auditId, status: next.status } });
                }
                if (next.resultStatus && (!prev || next.resultStatus !== prev.resultStatus)) {
                  events.push({ event: 'result', data: { auditId, status: next.resultStatus } });
                }
                return [next, events];
              }),
              Stream.mapConcat((events) => events),
              Stream.takeUntil((event) => event.event === 'result'),
              Stream.map(encodeSse),
            );

            return HttpServerResponse.stream(stream, {
              contentType: 'text/event-stream',
              headers: {
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
              },
            });
          }).pipe(
            Effect.withSpan('api.audit.watchById'),
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
          ),
        ),
      );
  }),
);
