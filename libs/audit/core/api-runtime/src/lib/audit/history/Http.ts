import { Effect, Schema } from 'effect';

import type { AuditKind } from '@app-speed/audit/core/domain';
import { AuditHistoryRepo } from '@app-speed/audit/core/persistence';

import { AuditHistoryInternalError, AuditHistoryInvalidCursorError, AuditHistoryInvalidQueryError } from '../Audit.js';

type AuditRunStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';
const AuditHistoryCursorSchema = Schema.Struct({
  createdAtMs: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  id: Schema.NonEmptyString,
});
type AuditHistoryCursor = typeof AuditHistoryCursorSchema.Type;

const allowedRunStatuses: ReadonlyArray<AuditRunStatus> = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETE'];
const defaultHistoryPageLimit = 25;
const maxHistoryPageLimit = 100;
const isAuditRunStatus = (status: string): status is AuditRunStatus =>
  allowedRunStatuses.some((allowedStatus) => allowedStatus === status);

const parseLimit = (value: string | undefined) => {
  if (value === undefined) return Effect.succeed(defaultHistoryPageLimit);

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maxHistoryPageLimit) {
    return Effect.fail(
      new AuditHistoryInvalidQueryError({
        code: 'INVALID_QUERY',
        message: `Query parameter "limit" must be an integer between 1 and ${maxHistoryPageLimit}.`,
        details: { limit: value },
      }),
    );
  }
  return Effect.succeed(parsed);
};

const parseStatusFilter = (value: string | ReadonlyArray<string> | undefined) => {
  if (value === undefined) return Effect.succeed<ReadonlyArray<AuditRunStatus> | null>(null);

  const chunks = Array.isArray(value) ? value : [value];
  const parsed = chunks
    .flatMap((chunk) => chunk.split(','))
    .map((status) => status.trim())
    .filter(Boolean);
  if (parsed.length === 0) return Effect.succeed<ReadonlyArray<AuditRunStatus> | null>(null);

  const invalidValues = parsed.filter((status) => !isAuditRunStatus(status));
  if (invalidValues.length > 0) {
    return Effect.fail(
      new AuditHistoryInvalidQueryError({
        code: 'INVALID_QUERY',
        message: 'Query parameter "status" contains unsupported values.',
        details: { status: invalidValues.join(',') },
      }),
    );
  }
  return Effect.succeed(Array.from(new Set(parsed.filter(isAuditRunStatus))));
};

const decodeCursor = (cursor: string | undefined) => {
  if (!cursor) return Effect.succeed<AuditHistoryCursor | null>(null);

  return Effect.try({
    try: () => {
      const value: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      return Schema.decodeUnknownSync(AuditHistoryCursorSchema)(value);
    },
    catch: () =>
      new AuditHistoryInvalidCursorError({
        code: 'INVALID_CURSOR',
        message: 'Query parameter "cursor" is malformed or unsupported.',
      }),
  });
};

const encodeCursor = (cursor: AuditHistoryCursor) => Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');

const normalizeError = (
  error: unknown,
): AuditHistoryInvalidQueryError | AuditHistoryInvalidCursorError | AuditHistoryInternalError => {
  if (error instanceof AuditHistoryInvalidQueryError || error instanceof AuditHistoryInvalidCursorError) return error;
  return new AuditHistoryInternalError({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected server error occurred.',
  });
};

export const historyHandler = (kind: AuditKind | null) =>
  Effect.fn('api.audit.history')((request) =>
    Effect.gen(function* () {
      const repo = yield* AuditHistoryRepo;
      const limit = yield* parseLimit(request.urlParams.limit);
      const status = yield* parseStatusFilter(request.urlParams.status);
      const cursor = yield* decodeCursor(request.urlParams.cursor);
      const page = yield* repo.listRunsPage({ limit, cursor, status, kind });

      return {
        items: page.items.map((run) => ({
          kind: run.kind,
          auditId: run.id,
          title: run.title,
          status: run.status,
          resultStatus: run.resultStatus,
          queuePosition: run.queuePosition,
          createdAt: run.createdAt.toISOString(),
          startedAt: run.startedAt?.toISOString() ?? null,
          completedAt: run.completedAt?.toISOString() ?? null,
          durationMs: run.durationMs,
        })),
        nextCursor: page.nextCursor ? encodeCursor(page.nextCursor) : null,
        limit,
      };
    }).pipe(Effect.withSpan('api.audit.history'), Effect.mapError(normalizeError)),
  );
