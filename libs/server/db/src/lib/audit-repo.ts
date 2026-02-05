import { Context, Brand, Effect, Layer } from 'effect';
import { ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';
import { DbClient } from './db';
import type { AuditResultStatus, Prisma } from '@prisma/client';

type AuditTemplateId = string & Brand.Brand<'AuditTemplateId'>;
const AuditTemplateId = Brand.nominal<AuditTemplateId>();

type AuditRunId = string & Brand.Brand<'AuditRunId'>;
const AuditRunId = Brand.nominal<AuditRunId>();

export type AuditStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE';

export type AuditTemplateRecord = {
  id: AuditTemplateId;
  data: ReplayUserflowAudit;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditRunRecord = {
  id: AuditRunId;
  templateId: AuditTemplateId;
  data: ReplayUserflowAudit;
  status: AuditStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
};

export type AuditResultRecord = {
  runId: AuditRunId;
  data: unknown;
  status: 'SUCCESS' | 'FAILURE';
  error: unknown | null;
  createdAt: Date;
};

export class AuditRepo extends Context.Tag('AuditRepo')<
  AuditRepo,
  {
    createTemplate: (audit: ReplayUserflowAudit) => Effect.Effect<AuditTemplateId>;
    getTemplateById: (id: AuditTemplateId) => Effect.Effect<AuditTemplateRecord | null>;
    createRun: (templateId: AuditTemplateId) => Effect.Effect<AuditRunId>;
    claimNextRun: () => Effect.Effect<AuditRunRecord | null>;
    markRunInProgress: (id: AuditRunId) => Effect.Effect<void>;
    completeRun: (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown },
      durationMs: number,
    ) => Effect.Effect<void>;
    getRunById: (id: AuditRunId) => Effect.Effect<AuditRunRecord | null>;
    getResultByRunId: (id: AuditRunId) => Effect.Effect<AuditResultRecord | null>;
  }
>() {}

const mapTemplate = (template: { id: string; data: Prisma.JsonValue; createdAt: Date; updatedAt: Date }):
  AuditTemplateRecord => ({
    id: template.id as AuditTemplateId,
    data: template.data as ReplayUserflowAudit,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  });

const mapRun = (run: {
  id: string;
  templateId: string;
  status: AuditStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  template: { data: Prisma.JsonValue };
}): AuditRunRecord => ({
  id: run.id as AuditRunId,
  templateId: run.templateId as AuditTemplateId,
  data: run.template.data as ReplayUserflowAudit,
  status: run.status,
  createdAt: run.createdAt,
  updatedAt: run.updatedAt,
  startedAt: run.startedAt,
  completedAt: run.completedAt,
  durationMs: run.durationMs,
});

const mapResult = (result: {
  runId: string;
  status: AuditResultStatus;
  data: Prisma.JsonValue | null;
  error: Prisma.JsonValue | null;
  createdAt: Date;
}): AuditResultRecord => ({
  runId: result.runId as AuditRunId,
  status: result.status,
  data: result.data ?? null,
  error: result.error ?? null,
  createdAt: result.createdAt,
});

export const AuditRepoLive = Layer.effect(
  AuditRepo,
  Effect.gen(function* () {
    const db = yield* DbClient;

    const createTemplate = (audit: ReplayUserflowAudit) =>
      db.run((c) => c.auditTemplate.create({ data: { data: audit } })).pipe(
        Effect.map((record) => record.id as AuditTemplateId),
      );

    const getTemplateById = (id: AuditTemplateId) =>
      db.run((c) => c.auditTemplate.findUnique({ where: { id } })).pipe(
        Effect.map((record) => (record ? mapTemplate(record) : null)),
      );

    const createRun = (templateId: AuditTemplateId) =>
      db.run((c) => c.auditRun.create({ data: { templateId } })).pipe(
        Effect.map((record) => record.id as AuditRunId),
      );

    const claimNextRun = () =>
      db.run((c) =>
        c.$transaction(async (tx) => {
          const next = await tx.auditRun.findFirst({
            where: { status: 'SCHEDULED' },
            orderBy: { createdAt: 'asc' },
            include: { template: true },
          });

          if (!next) return null;

          const updated = await tx.auditRun.updateMany({
            where: { id: next.id, status: 'SCHEDULED' },
            data: { status: 'IN_PROGRESS', startedAt: new Date() },
          });

          if (updated.count === 0) return null;

          const claimed = await tx.auditRun.findUnique({
            where: { id: next.id },
            include: { template: true },
          });

          return claimed ? mapRun(claimed) : null;
        }),
      );

    const markRunInProgress = (id: AuditRunId) =>
      db.run((c) =>
        c.auditRun.update({
          where: { id },
          data: { status: 'IN_PROGRESS', startedAt: new Date() },
        }),
      ).pipe(Effect.asVoid);

    const completeRun = (
      id: AuditRunId,
      result: { status: 'SUCCESS' | 'FAILURE'; data: unknown; error?: unknown },
      durationMs: number,
    ) =>
      db.run((c) =>
        c.$transaction(async (tx) => {
          await tx.auditRun.update({
            where: { id },
            data: {
              status: 'COMPLETE',
              completedAt: new Date(),
              durationMs,
            },
          });

          await tx.auditResult.create({
            data: {
              runId: id,
              status: result.status,
              data: (result.data ?? null) as Prisma.JsonValue | null,
              error: (result.error ?? null) as Prisma.JsonValue | null,
            },
          });
        }),
      ).pipe(Effect.asVoid);

    const getRunById = (id: AuditRunId) =>
      db.run((c) =>
        c.auditRun.findUnique({ where: { id }, include: { template: true } }),
      ).pipe(Effect.map((record) => (record ? mapRun(record) : null)));

    const getResultByRunId = (id: AuditRunId) =>
      db.run((c) => c.auditResult.findUnique({ where: { runId: id } })).pipe(
        Effect.map((record) => (record ? mapResult(record) : null)),
      );

    return {
      createTemplate,
      getTemplateById,
      createRun,
      claimNextRun,
      markRunInProgress,
      completeRun,
      getRunById,
      getResultByRunId,
    };
  }),
);
