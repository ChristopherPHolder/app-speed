import { randomUUID } from 'node:crypto';
import { Clock, Effect, Layer } from 'effect';

import type { Audit } from '@app-speed/audit/domain';

import { AuditRepo } from '../audit-repo';
import {
  type AuditRunDetailsRecord,
  type AuditRunId,
  type AuditRunListCursor,
  type AuditRunRecord,
  type AuditRunSummaryRecord,
  type AuditStatus,
  type AuditTemplateId,
  resolveAuditTitle,
} from './shared';

type TemplateState = {
  id: AuditTemplateId;
  data: Audit;
  createAt: Date;
  updatedAt: Date;
};

type RunState = {
  id: AuditRunId;
  templateId: AuditTemplateId;
  status: AuditStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
};

type ResultState = {
  runId: AuditRunId;
  data: unknown;
  status: 'SUCCESS' | 'FAILURE';
  error: unknown | null;
  reportHtml: string | null;
  createdAt: Date;
};

const compareOldestFirst = (left: RunState, right: RunState) =>
  left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id);

const compareNewestFirst = (left: RunState, right: RunState) =>
  right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id);

const makeRunRecord = (run: RunState, template: TemplateState): AuditRunRecord => ({
  id: run.id,
  templateId: run.templateId,
  data: template.data,
  status: run.status,
  createdAt: run.createdAt,
  updatedAt: run.updatedAt,
  startedAt: run.startedAt,
  completedAt: run.completedAt,
  durationMs: run.durationMs,
});

const makeSummaryRecord = (
  run: RunState,
  template: TemplateState,
  result: ResultState | undefined,
  queuePosition: number | null,
): AuditRunSummaryRecord => ({
  id: run.id,
  title: resolveAuditTitle(template.data),
  status: run.status,
  resultStatus: result?.status ?? null,
  queuePosition,
  createdAt: run.createdAt,
  startedAt: run.startedAt,
  completedAt: run.completedAt,
  durationMs: run.durationMs,
});

const makeDetailsRecord = (
  run: RunState,
  template: TemplateState,
  result: ResultState | undefined,
  queuePosition: number | null,
): AuditRunDetailsRecord => ({
  id: run.id,
  data: template.data,
  status: run.status,
  resultStatus: result?.status ?? null,
  queuePosition,
  createdAt: run.createdAt,
  startedAt: run.startedAt,
  completedAt: run.completedAt,
  durationMs: run.durationMs,
});

export const AuditRepoInMemory = Layer.sync(AuditRepo, () => {
  const templates = new Map<AuditTemplateId, TemplateState>();
  const runs = new Map<AuditRunId, RunState>();
  const results = new Map<AuditRunId, ResultState>();

  const now = () => Clock.currentTimeMillis.pipe(Effect.map((time) => new Date(time)));

  const getQueuePositionValue = (id: AuditRunId) => {
    const run = runs.get(id);
    if (!run) {
      return null;
    }
    if (run.status !== 'SCHEDULED') {
      return 0;
    }
    return [...runs.values()].filter(
      (candidate) => candidate.status === 'SCHEDULED' && compareOldestFirst(candidate, run) < 0,
    ).length;
  };

  return {
    createTemplate: (audit: Audit) =>
      Effect.gen(function* () {
        const createdAt = yield* now();
        const id = randomUUID() as AuditTemplateId;
        templates.set(id, { id, data: audit, createAt: createdAt, updatedAt: createdAt });
        return id;
      }),
    getTemplateById: (id: AuditTemplateId) => Effect.succeed(templates.get(id) ?? null),
    createRun: (templateId: AuditTemplateId) =>
      Effect.gen(function* () {
        const createdAt = yield* now();
        const id = randomUUID() as AuditRunId;
        runs.set(id, {
          id,
          templateId,
          status: 'SCHEDULED',
          createdAt,
          updatedAt: createdAt,
          startedAt: null,
          completedAt: null,
          durationMs: null,
        });
        return id;
      }),
    claimNextRun: () =>
      Effect.gen(function* () {
        const startedAt = yield* now();
        const next = [...runs.values()].filter((run) => run.status === 'SCHEDULED').sort(compareOldestFirst)[0];
        if (!next) {
          return null;
        }
        next.status = 'IN_PROGRESS';
        next.startedAt = startedAt;
        next.updatedAt = startedAt;
        const template = templates.get(next.templateId);
        return template ? makeRunRecord(next, template) : null;
      }),
    hasScheduledRuns: () => Effect.succeed([...runs.values()].some((run) => run.status === 'SCHEDULED')),
    markRunInProgress: (id: AuditRunId) =>
      Effect.gen(function* () {
        const updatedAt = yield* now();
        const run = runs.get(id);
        if (run) {
          run.status = 'IN_PROGRESS';
          run.startedAt = updatedAt;
          run.updatedAt = updatedAt;
        }
      }),
    getQueuePosition: (id: AuditRunId) => Effect.succeed(getQueuePositionValue(id)),
    getRunSummaryById: (id: AuditRunId) =>
      Effect.succeed(
        (() => {
          const run = runs.get(id);
          const template = run ? templates.get(run.templateId) : undefined;
          if (!run || !template) {
            return null;
          }
          return makeSummaryRecord(
            run,
            template,
            results.get(id),
            run.status === 'SCHEDULED' ? (getQueuePositionValue(id) ?? 0) : null,
          );
        })(),
      ),
    getRunDetailsById: (id: AuditRunId) =>
      Effect.succeed(
        (() => {
          const run = runs.get(id);
          const template = run ? templates.get(run.templateId) : undefined;
          if (!run || !template) {
            return null;
          }
          return makeDetailsRecord(
            run,
            template,
            results.get(id),
            run.status === 'SCHEDULED' ? (getQueuePositionValue(id) ?? 0) : null,
          );
        })(),
      ),
    listRunsPage: (params: {
      limit: number;
      cursor: AuditRunListCursor | null;
      status: ReadonlyArray<AuditStatus> | null;
    }) =>
      Effect.succeed(
        (() => {
          const limit = Math.max(1, Math.min(params.limit, 100));
          const statusSet = params.status && params.status.length > 0 ? new Set(params.status) : null;
          const filtered = [...runs.values()]
            .filter((run) => !statusSet || statusSet.has(run.status))
            .filter((run) => {
              if (!params.cursor) {
                return true;
              }
              const createdAtMs = run.createdAt.getTime();
              return (
                createdAtMs < params.cursor.createdAtMs ||
                (createdAtMs === params.cursor.createdAtMs && run.id < params.cursor.id)
              );
            })
            .sort(compareNewestFirst);
          const pageRuns = filtered.slice(0, limit);
          const items = pageRuns.flatMap((run) => {
            const template = templates.get(run.templateId);
            if (!template) {
              return [];
            }
            return [
              makeSummaryRecord(
                run,
                template,
                results.get(run.id),
                run.status === 'SCHEDULED' ? (getQueuePositionValue(run.id) ?? 0) : null,
              ),
            ];
          });
          const last = pageRuns[pageRuns.length - 1];
          return {
            items,
            nextCursor:
              filtered.length > limit && last
                ? {
                    createdAtMs: last.createdAt.getTime(),
                    id: last.id,
                  }
                : null,
          };
        })(),
      ),
    completeRun: (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown; reportHtml?: string | null },
      durationMs: number,
    ) =>
      Effect.gen(function* () {
        const completedAt = yield* now();
        const normalizedDurationMs = Math.round(durationMs);
        const run = runs.get(id);
        if (run) {
          run.status = 'COMPLETE';
          run.completedAt = completedAt;
          run.durationMs = normalizedDurationMs;
          run.updatedAt = completedAt;
          results.set(id, {
            runId: id,
            data: result.status === 'SUCCESS' ? result.data : null,
            status: result.status,
            error: result.status === 'FAILURE' ? (result.error ?? null) : null,
            reportHtml: result.status === 'SUCCESS' ? (result.reportHtml ?? null) : null,
            createdAt: completedAt,
          });
        }
      }),
    getRunById: (id: AuditRunId) =>
      Effect.succeed(
        (() => {
          const run = runs.get(id);
          const template = run ? templates.get(run.templateId) : undefined;
          return run && template ? makeRunRecord(run, template) : null;
        })(),
      ),
    getResultByRunId: (id: AuditRunId) => Effect.succeed(results.get(id) ?? null),
  };
});
