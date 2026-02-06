import { HttpApiBuilder, HttpApiError, HttpServerResponse } from '@effect/platform';
import { Api } from '../Api.js';
import { Duration, Effect, Schedule, Stream } from 'effect';
import { AuditRepo } from '@app-speed/server/db';
import { AuditNotFoundError } from './Audit';
import { RunnerService } from '../Runner/RunnerService.js';

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

export const AuditGroupLive = HttpApiBuilder.group(Api, 'audit', (handlers) =>
  Effect.gen(function* () {
    yield* Effect.logDebug('AuditGroupLive');
    const repo = yield* AuditRepo;

    return handlers
      .handle('findById', (request) =>
        repo.getRunById(request.path.id).pipe(
          Effect.filterOrFail(
            (r) => r !== null,
            () => new AuditNotFoundError({ id: request.path.id }),
          ),
          Effect.map((audit) => ({ status: audit.status })),
          Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
          Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
        ),
      )
      .handle('resultById', (request) =>
        repo.getRunById(request.path.id).pipe(
          Effect.filterOrFail(
            (r) => r !== null,
            () => new AuditNotFoundError({ id: request.path.id }),
          ),
          Effect.flatMap(() => repo.getResultByRunId(request.path.id)),
          Effect.filterOrFail(
            (r) => r !== null,
            () => new HttpApiError.NotFound(),
          ),
          Effect.map((result) => ({
            status: result.status,
            result: result.data,
            error: result.error ?? undefined,
          })),
          Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
          Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
        ),
      )
      .handle('schedule', (request) =>
        Effect.gen(function* () {
          const templateId = yield* repo.createTemplate(request.payload);
          const runner = yield* RunnerService;
          const auditId = yield* repo.createRun(templateId);
          const auditQueuePosition = yield* repo.getQueuePosition(auditId);
          yield* runner.kick;
          return { auditId, auditQueuePosition: auditQueuePosition ?? 0 };
        }).pipe(
          Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
          Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
        ),
      )
      .handle('watchById', (request) =>
        Effect.gen(function* () {
          const auditId = request.path.id;
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
            return {
              status: run.status,
              position: position ?? 0,
              resultStatus: result?.status ?? null,
            } satisfies AuditSnapshot;
          });

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

          return HttpServerResponse.stream(stream);
        }).pipe(
          Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
          Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
        ),
      );
  }),
);
