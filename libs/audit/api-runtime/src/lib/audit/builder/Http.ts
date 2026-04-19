import { HttpApiError, HttpServerResponse } from '@effect/platform';
import { Duration, Effect, Schedule, Stream } from 'effect';

import { AuditRepo } from '@app-speed/audit/persistence';

import { RunnerLifecycle } from '../../runner/RunnerLifecycle.js';
import { AuditNotFoundError } from '../Audit.js';

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

export const findByIdHandler = Effect.fn('api.audit.findById')((request) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;

    return yield* repo.getRunById(request.path.id).pipe(
      Effect.tap(() => Effect.annotateCurrentSpan({ 'audit.id': request.path.id })),
      Effect.filterOrFail(
        (run) => run !== null,
        () => new AuditNotFoundError({ id: request.path.id }),
      ),
      Effect.tap((audit) => Effect.annotateCurrentSpan({ 'audit.status': audit.status })),
      Effect.map((audit) => ({ status: audit.status })),
      Effect.withSpan('api.audit.findById'),
      Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
      Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
    );
  }),
);

export const scheduleHandler = Effect.fn('api.audit.schedule')((request) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;
    const runnerLifecycle = yield* RunnerLifecycle;

    return yield* Effect.gen(function* () {
      yield* Effect.annotateCurrentSpan({
        'audit.title': request.payload.title,
        'audit.device': request.payload.device,
      });
      const templateId = yield* repo.createTemplate(request.payload);
      const auditId = yield* repo.createRun(templateId);
      const auditQueuePosition = yield* repo.getQueuePosition(auditId);
      yield* runnerLifecycle.requestActivation;
      yield* Effect.annotateCurrentSpan({
        'audit.id': auditId,
        'queue.position': auditQueuePosition ?? 0,
      });
      return { auditId, auditQueuePosition: auditQueuePosition ?? 0 };
    }).pipe(
      Effect.withSpan('api.audit.schedule'),
      Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
      Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
    );
  }),
);

export const watchByIdHandler = Effect.fn('api.audit.watchById')((request) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;
    const auditId = request.path.id;

    yield* Effect.annotateCurrentSpan({
      'audit.id': auditId,
      'poll.interval_ms': Duration.toMillis(Duration.seconds(1)),
    });
    yield* repo.getRunById(auditId).pipe(
      Effect.filterOrFail(
        (run) => run !== null,
        () => new AuditNotFoundError({ id: auditId }),
      ),
    );

    const snapshot = Effect.gen(function* () {
      const run = yield* repo.getRunById(auditId).pipe(
        Effect.filterOrFail(
          (value) => value !== null,
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
);
