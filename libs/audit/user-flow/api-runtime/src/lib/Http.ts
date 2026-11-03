import { HttpServerRequest, HttpServerResponse } from 'effect/http';
import { HttpApiBuilder, HttpApiError } from 'effect/http-api';
import { Duration, Effect, Schedule, Stream } from 'effect';

import { AuditNotFoundError } from '@app-speed/audit/core/api-contract';
import {
  AuditAccess,
  hashCredential,
  newCredential,
  historyHandler,
  RunnerLifecycle,
} from '@app-speed/audit/core/api-runtime';
import { AuditRepo, type AuditRunId } from '@app-speed/audit/core/persistence';
import { UserFlowApi } from '@app-speed/audit/user-flow/api-contract';
import { ClerkIdentity } from '@app-speed/platform/auth-api';
import { USER_FLOW_AUDIT_KIND, USER_FLOW_AUDIT_KIND_LITERAL } from '@app-speed/audit/user-flow/domain';
import { SpaceAuditRepo, UserFlowAuditRepo, UserFlowAuditScheduler } from '@app-speed/audit/user-flow/persistence';

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
    const access = yield* AuditAccess;
    const spaces = yield* SpaceAuditRepo;
    const clerk = yield* ClerkIdentity;
    const scheduler = yield* UserFlowAuditScheduler;
    const repo = yield* AuditRepo;
    const userFlowRepo = yield* UserFlowAuditRepo;
    const runnerLifecycle = yield* RunnerLifecycle;

    return handlers
      .handle(
        'manage',
        Effect.fn('api.userFlowAudit.manage')(function* (request) {
          const space = yield* access.space;
          const actor = yield* access.current;
          const command = request.payload;
          if (command.action === 'updateSchedule' && command.createdBy) {
            yield* clerk
              .authorize(command.createdBy, space.id)
              .pipe(Effect.mapError(() => new HttpApiError.Forbidden()));
          }
          const shareToken = command.action === 'share' ? newCredential() : null;
          const result = yield* spaces
            .execute(command, space, {
              browserHash: actor.browserHash,
              claimHash: command.action === 'claim' ? hashCredential(command.claimToken) : null,
              shareHash: shareToken ? hashCredential(shareToken) : null,
            })
            .pipe(Effect.mapError(() => new HttpApiError.BadRequest()));
          if (command.action === 'run') yield* runnerLifecycle.requestActivation;
          const jsonResult: unknown = JSON.parse(JSON.stringify(result));
          return shareToken ? { result: jsonResult, shareToken } : jsonResult;
        }),
      )
      .handle(
        'scheduleUserFlowAudit',
        Effect.fn('api.userFlowAudit.schedule')((request) =>
          Effect.gen(function* () {
            const actor = yield* access.current;
            const space = actor.identity ? yield* access.space : null;
            const claimToken = !space && actor.browserHash ? newCredential() : null;
            const auditId = yield* scheduler.schedule(request.payload, {
              spaceId: space?.id ?? null,
              createdBy: actor.identity?.userId ?? null,
              guestBrowserHash: space ? null : actor.browserHash,
              claimHash: claimToken ? hashCredential(claimToken) : null,
            });
            const auditQueuePosition = yield* repo.getQueuePosition(auditId);
            yield* runnerLifecycle.requestActivation;
            return { auditId, claimToken, auditQueuePosition: auditQueuePosition ?? 0 };
          }).pipe(
            Effect.withSpan('api.userFlowAudit.schedule'),
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle(
        'findUserFlowAuditById',
        Effect.fn('api.userFlowAudit.findById')((request) =>
          Effect.gen(function* () {
            const run = yield* requireUserFlowRun(request.params.id);
            yield* access.run(request.params.id);
            const audit = yield* userFlowRepo.getRunDefinition(request.params.id);
            if (audit === null) {
              return yield* new AuditNotFoundError({ id: request.params.id });
            }
            return { status: run.status, audit };
          }).pipe(
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
            yield* access.run(auditId);
            yield* requireUserFlowRun(auditId);
            const snapshot = Effect.gen(function* () {
              yield* access.run(auditId);
              const run = yield* requireUserFlowRun(auditId);
              const position = yield* repo.getQueuePosition(auditId);
              const result = run.status === 'COMPLETE' ? yield* repo.getResultByRunId(auditId) : null;
              return {
                status: run.status,
                position: position ?? 0,
                resultStatus: result?.status ?? null,
              } satisfies AuditSnapshot;
            });
            const httpRequest = yield* HttpServerRequest.HttpServerRequest;
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
              Stream.provideService(HttpServerRequest.HttpServerRequest, httpRequest),
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
            yield* access.run(request.params.id, true);
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
      .handleRaw(
        'reportById',
        Effect.fn('api.userFlowAudit.reportById')((request) =>
          Effect.gen(function* () {
            yield* access.run(request.params.id, true);
            yield* requireUserFlowRun(request.params.id);
            const result = yield* userFlowRepo.getResultByRunId(request.params.id);
            if (result === null || result.status !== 'SUCCESS') return yield* new HttpApiError.NotFound();
            return HttpServerResponse.text(result.reportHtml, {
              contentType: 'text/html',
              headers: {
                'Cache-Control': 'no-store',
                'Content-Security-Policy':
                  "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:",
                'Referrer-Policy': 'no-referrer',
              },
            });
          }).pipe(
            Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
            Effect.catchTag('SchemaError', () => new HttpApiError.BadRequest()),
          ),
        ),
      )
      .handle('history', historyHandler(USER_FLOW_AUDIT_KIND));
  }),
);
