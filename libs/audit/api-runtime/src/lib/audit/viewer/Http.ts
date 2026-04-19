import { HttpApiError } from '@effect/platform';
import { Effect } from 'effect';

import { AuditRepo } from '@app-speed/audit/persistence';

import { AuditErrorSchema, AuditNotFoundError } from '../Audit.js';

type AuditError = typeof AuditErrorSchema.Type;

const normalizeError = (error: unknown): AuditError => {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return {
      name: typeof record['name'] === 'string' ? record['name'] : 'Error',
      message: typeof record['message'] === 'string' ? record['message'] : 'Unknown error',
      stack: typeof record['stack'] === 'string' ? record['stack'] : '',
    };
  }
  if (typeof error === 'string') {
    return { name: 'Error', message: error, stack: '' };
  }
  return { name: 'Error', message: 'Unknown error', stack: '' };
};

const toSuccessResult = (result: unknown) => ({ status: 'SUCCESS', result }) as const;
const toFailureResult = (error: AuditError) => ({ status: 'FAILURE', error }) as const;

export const resultByIdHandler = Effect.fn('api.audit.resultById')((request) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;

    return yield* repo.getRunById(request.path.id).pipe(
      Effect.tap(() => Effect.annotateCurrentSpan({ 'audit.id': request.path.id })),
      Effect.filterOrFail(
        (run) => run !== null,
        () => new AuditNotFoundError({ id: request.path.id }),
      ),
      Effect.flatMap(() => repo.getResultByRunId(request.path.id)),
      Effect.filterOrFail(
        (result) => result !== null,
        () => new HttpApiError.NotFound(),
      ),
      Effect.map((result) =>
        result.status === 'SUCCESS' ? toSuccessResult(result.data) : toFailureResult(normalizeError(result.error)),
      ),
      Effect.tap((result) => Effect.annotateCurrentSpan({ 'audit.result_status': result.status })),
      Effect.withSpan('api.audit.resultById'),
      Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
      Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
    );
  }),
);

export const reportByIdHandler = Effect.fn('api.audit.reportById')((request) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;

    return yield* repo.getRunById(request.path.id).pipe(
      Effect.tap(() => Effect.annotateCurrentSpan({ 'audit.id': request.path.id })),
      Effect.filterOrFail(
        (run) => run !== null,
        () => new AuditNotFoundError({ id: request.path.id }),
      ),
      Effect.flatMap(() => repo.getResultByRunId(request.path.id)),
      Effect.flatMap((result) => {
        if (result === null || result.reportHtml === null) {
          return Effect.fail(new HttpApiError.NotFound());
        }

        return Effect.annotateCurrentSpan({ 'audit.result_status': result.status }).pipe(Effect.as(result.reportHtml));
      }),
      Effect.withSpan('api.audit.reportById'),
      Effect.catchTag('QueryError', () => new HttpApiError.BadRequest()),
      Effect.catchTag('ParseError', () => new HttpApiError.BadRequest()),
    );
  }),
);
