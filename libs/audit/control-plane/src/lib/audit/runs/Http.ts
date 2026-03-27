import { Effect } from 'effect';

import { AuditRepo } from '@app-speed/audit/persistence';

import {
  AuditIdType,
  AuditRunSummaryNotFoundError,
  AuditRunsInternalError,
  AuditRunsInvalidCursorError,
  AuditRunsInvalidQueryError,
} from '../Audit.js';

type AuditRunStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
type AuditRunsCursor = {
  createdAtMs: number;
  id: string;
};

const allowedRunStatuses: ReadonlyArray<AuditRunStatus> = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'];
const defaultRunsPageLimit = 25;
const maxRunsPageLimit = 100;

const parseLimit = (value: string | undefined) => {
  if (value === undefined) {
    return Effect.succeed(defaultRunsPageLimit);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maxRunsPageLimit) {
    return Effect.fail(
      new AuditRunsInvalidQueryError({
        code: 'INVALID_QUERY',
        message: `Query parameter "limit" must be an integer between 1 and ${maxRunsPageLimit}.`,
        details: { limit: value },
      }),
    );
  }

  return Effect.succeed(parsed);
};

const parseStatusFilter = (value: string | ReadonlyArray<string> | undefined) => {
  if (value === undefined) {
    return Effect.succeed<ReadonlyArray<AuditRunStatus> | null>(null);
  }

  const chunks = Array.isArray(value) ? value : [value];
  const parsed = chunks
    .flatMap((chunk) => chunk.split(','))
    .map((status) => status.trim())
    .filter((status): status is string => status.length > 0);

  if (parsed.length === 0) {
    return Effect.succeed<ReadonlyArray<AuditRunStatus> | null>(null);
  }

  const invalidValues = parsed.filter(
    (status): status is string => !allowedRunStatuses.includes(status as AuditRunStatus),
  );
  if (invalidValues.length > 0) {
    return Effect.fail(
      new AuditRunsInvalidQueryError({
        code: 'INVALID_QUERY',
        message: 'Query parameter "status" contains unsupported values.',
        details: { status: invalidValues.join(',') },
      }),
    );
  }

  return Effect.succeed(Array.from(new Set(parsed)) as ReadonlyArray<AuditRunStatus>);
};

const decodeCursor = (cursor: string | undefined) => {
  if (!cursor) {
    return Effect.succeed<AuditRunsCursor | null>(null);
  }

  return Effect.try({
    try: () => {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const value = JSON.parse(decoded) as { createdAtMs?: unknown; id?: unknown };
      if (
        typeof value !== 'object' ||
        value === null ||
        typeof value.createdAtMs !== 'number' ||
        !Number.isFinite(value.createdAtMs) ||
        value.createdAtMs < 0 ||
        !Number.isInteger(value.createdAtMs) ||
        typeof value.id !== 'string' ||
        value.id.length === 0
      ) {
        throw new Error('Invalid cursor payload');
      }
      return {
        createdAtMs: value.createdAtMs,
        id: value.id,
      } satisfies AuditRunsCursor;
    },
    catch: () =>
      new AuditRunsInvalidCursorError({
        code: 'INVALID_CURSOR',
        message: 'Query parameter "cursor" is malformed or unsupported.',
      }),
  });
};

const encodeCursor = (cursor: AuditRunsCursor) => Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');

const normalizeListRunsError = (
  error: unknown,
): AuditRunsInvalidQueryError | AuditRunsInvalidCursorError | AuditRunsInternalError => {
  if (
    error instanceof AuditRunsInvalidQueryError ||
    error instanceof AuditRunsInvalidCursorError ||
    error instanceof AuditRunsInternalError
  ) {
    return error;
  }

  if (error && typeof error === 'object' && '_tag' in error) {
    const tag = (error as { _tag?: string })._tag;
    if (tag === 'QueryError' || tag === 'ParseError') {
      return new AuditRunsInternalError({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected server error occurred.',
      });
    }
  }

  return new AuditRunsInternalError({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected server error occurred.',
  });
};

const normalizeRunByIdError = (error: unknown): AuditRunSummaryNotFoundError | AuditRunsInternalError => {
  if (error instanceof AuditRunSummaryNotFoundError || error instanceof AuditRunsInternalError) {
    return error;
  }

  if (error && typeof error === 'object' && '_tag' in error) {
    const tag = (error as { _tag?: string })._tag;
    if (tag === 'QueryError' || tag === 'ParseError') {
      return new AuditRunsInternalError({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected server error occurred.',
      });
    }
  }

  return new AuditRunsInternalError({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected server error occurred.',
  });
};

const toRunSummaryResponse = (run: {
  id: AuditIdType;
  title: string;
  status: AuditRunStatus;
  resultStatus: 'SUCCESS' | 'FAILURE' | null;
  queuePosition: number | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
}) => ({
  auditId: run.id,
  title: run.title,
  status: run.status,
  resultStatus: run.resultStatus,
  queuePosition: run.queuePosition,
  createdAt: run.createdAt.toISOString(),
  startedAt: run.startedAt ? run.startedAt.toISOString() : null,
  completedAt: run.completedAt ? run.completedAt.toISOString() : null,
  durationMs: run.durationMs,
});

export const listRunsHandler = Effect.fn('api.audit.listRuns')((request) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;
    const limit = yield* parseLimit(request.urlParams.limit);
    const status = yield* parseStatusFilter(request.urlParams.status);
    const cursor = yield* decodeCursor(request.urlParams.cursor);

    const page = yield* repo.listRunsPage({ limit, cursor, status });

    return {
      items: page.items.map(toRunSummaryResponse),
      nextCursor: page.nextCursor ? encodeCursor(page.nextCursor) : null,
      limit,
    };
  }).pipe(Effect.withSpan('api.audit.listRuns'), Effect.mapError(normalizeListRunsError)),
);

export const runByIdHandler = Effect.fn('api.audit.runById')((request) =>
  Effect.gen(function* () {
    const repo = yield* AuditRepo;
    const run = yield* repo.getRunSummaryById(request.path.id);
    if (!run) {
      return yield* new AuditRunSummaryNotFoundError({
        code: 'RUN_NOT_FOUND',
        message: `Audit run ${request.path.id} was not found.`,
        details: { auditId: request.path.id },
      });
    }

    return toRunSummaryResponse(run);
  }).pipe(Effect.withSpan('api.audit.runById'), Effect.mapError(normalizeRunByIdError)),
);
