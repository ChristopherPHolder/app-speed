import { Config, Context, DateTime, Effect, Layer, Schema } from 'effect';
import { McpServer, Tool, Toolkit } from 'effect/ai';
import { AuditHistoryItemSchema, AuditHistoryPageSchema } from '@app-speed/audit/core/api-contract';
import { AuditHistoryRepo, AuditRepo, AuditRunIdSchema } from '@app-speed/audit/core/persistence';
import { McpCaller, McpToolError, toolError } from '@app-speed/platform/mcp';
import { WorkspaceStore } from '@app-speed/workspace/api-runtime';

import { historyHandler } from './history/Http';
import { authorizedAuditProject } from './scope';

const ProjectIdParameter = Schema.optional(
  Schema.String.annotate({
    description:
      'Project to act in (from get_workspaces). Omit to use Public View, which only contains audits without a project.',
  }),
);
const RunStatus = Schema.Literals(['SCHEDULED', 'IN_PROGRESS', 'COMPLETE']);
const ResultStatus = Schema.Literals(['SUCCESS', 'FAILURE']);

/** Where audit links in tool results point. Configure the portal origin with `PORTAL_URL`. */
export class PortalLinks extends Context.Service<
  PortalLinks,
  {
    readonly audit: (kind: string, auditId: string, projectId: string | null) => string;
    readonly history: (projectId: string | null) => string;
  }
>()('@app-speed/audit/core/api-runtime/PortalLinks') {
  static readonly layer = Layer.effect(
    PortalLinks,
    Effect.gen(function* () {
      const portal = yield* Config.URL('PORTAL_URL').pipe(Config.withDefault(new URL('https://appspeed.dev')));
      const scoped = (path: string, projectId: string | null) => {
        const url = new URL(path, portal.origin);
        if (projectId) url.searchParams.set('projectId', projectId);
        return url.href;
      };
      return PortalLinks.of({
        audit: (kind, auditId, projectId) => scoped(`/audits/${kind}/${encodeURIComponent(auditId)}`, projectId),
        history: (projectId) => scoped('/audits/history', projectId),
      });
    }),
  );
}

/**
 * Resolves an optional project for the calling account. `null` is Public View. A project ID is never proof of access:
 * membership and project grants are checked on every call.
 */
export const mcpAuditProject = Effect.fn('mcpAuditProject')(function* (projectId: string | undefined) {
  if (projectId === undefined) return null;
  const { account } = yield* McpCaller;
  const project = yield* authorizedAuditProject(account.id, projectId).pipe(
    Effect.mapError(() => new McpToolError({ message: 'Project access could not be verified. Please try again.' })),
  );
  if (!project)
    return yield* new McpToolError({
      message: `Project ${projectId} does not exist or you do not have access to it. Use get_workspaces to list projects.`,
    });
  return project;
});

const AuditSummary = Schema.Struct({
  auditId: Schema.String,
  kind: Schema.String,
  status: RunStatus,
  resultStatus: Schema.NullOr(ResultStatus),
  queuePosition: Schema.NullOr(Schema.Finite),
  projectId: Schema.NullOr(Schema.String),
  source: Schema.Literals(['portal', 'mcp']),
  clientName: Schema.NullOr(Schema.String),
  createdAt: Schema.String,
  startedAt: Schema.NullOr(Schema.String),
  completedAt: Schema.NullOr(Schema.String),
  durationMs: Schema.NullOr(Schema.Finite),
  url: Schema.String,
});

export const ListAudits = Tool.make('list_audits', {
  description:
    'Lists audit runs, newest first, for a project or for Public View. Supports search by title or audit ID, ' +
    'status and outcome filters, and cursor pagination.',
  parameters: Schema.Struct({
    projectId: ProjectIdParameter,
    search: Schema.optional(Schema.String.annotate({ description: 'Matches audit titles or IDs.' })),
    status: Schema.optional(Schema.Array(RunStatus)),
    outcome: Schema.optional(ResultStatus),
    limit: Schema.optional(Schema.Finite.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: 100 }))),
    cursor: Schema.optional(Schema.String.annotate({ description: 'nextCursor from a previous page.' })),
  }),
  success: Schema.Struct({
    ...AuditHistoryPageSchema.fields,
    items: Schema.Array(Schema.Struct({ ...AuditHistoryItemSchema.fields, url: Schema.String })),
    historyUrl: Schema.String,
  }),
  failure: McpToolError,
  dependencies: [McpCaller],
})
  .annotate(Tool.Title, 'List audits')
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const GetAuditStatus = Tool.make('get_audit_status', {
  description:
    'Returns the status of an audit run: queue position while scheduled, then progress and outcome. ' +
    'Poll this after scheduling an audit; results are available once status is COMPLETE.',
  parameters: Schema.Struct({ auditId: Schema.String, projectId: ProjectIdParameter }),
  success: AuditSummary,
  failure: McpToolError,
  dependencies: [McpCaller],
})
  .annotate(Tool.Title, 'Get audit status')
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const AuditMcpToolkit = Toolkit.make(ListAudits, GetAuditStatus);

const notFound = (auditId: string) =>
  new McpToolError({
    message: `Audit ${auditId} was not found in this scope. Audits in a project require that project's projectId.`,
  });

const isoString = (date: Date) => DateTime.formatIso(DateTime.fromDateUnsafe(date));
const unavailable = () => new McpToolError({ message: 'The audit could not be loaded. Please try again.' });

export const AuditMcpToolsLive = AuditMcpToolkit.toLayer(
  Effect.gen(function* () {
    const services = yield* Effect.context<AuditRepo | AuditHistoryRepo | WorkspaceStore | PortalLinks>();
    const links = yield* PortalLinks;
    const repo = yield* AuditRepo;
    return AuditMcpToolkit.of({
      list_audits: Effect.fn('AuditMcpToolkit.list_audits')(function* (params) {
        const projectId = yield* mcpAuditProject(params.projectId);
        const page = yield* historyHandler(null)(
          {
            query: {
              search: params.search,
              outcome: params.outcome,
              limit: params.limit === undefined ? undefined : String(params.limit),
              cursor: params.cursor,
              status: params.status && params.status.length > 0 ? params.status.join(',') : undefined,
            },
          },
          projectId,
        ).pipe(Effect.mapError(toolError));
        return {
          ...page,
          items: page.items.map((item) => ({ ...item, url: links.audit(item.kind, item.auditId, projectId) })),
          historyUrl: links.history(projectId),
        };
      }, Effect.provide(services)),
      get_audit_status: Effect.fn('AuditMcpToolkit.get_audit_status')(function* (params) {
        const projectId = yield* mcpAuditProject(params.projectId);
        const id = yield* Schema.decodeEffect(AuditRunIdSchema)(params.auditId).pipe(
          Effect.mapError(() => notFound(params.auditId)),
        );
        const run = yield* repo.getRunById(id).pipe(Effect.mapError(unavailable));
        // An audit ID alone never grants access: the stored owner must match the requested scope exactly.
        if (run === null || run.projectId !== projectId) return yield* notFound(params.auditId);
        const result =
          run.status === 'COMPLETE' ? yield* repo.getResultByRunId(id).pipe(Effect.mapError(unavailable)) : null;
        const queuePosition =
          run.status === 'SCHEDULED'
            ? ((yield* repo.getQueuePosition(id).pipe(Effect.mapError(unavailable))) ?? 0)
            : null;
        return {
          auditId: run.id,
          kind: run.kind,
          status: run.status,
          resultStatus: result?.status ?? null,
          queuePosition,
          projectId,
          source: run.source,
          clientName: run.clientName,
          createdAt: isoString(run.createdAt),
          startedAt: run.startedAt ? isoString(run.startedAt) : null,
          completedAt: run.completedAt ? isoString(run.completedAt) : null,
          durationMs: run.durationMs,
          url: links.audit(run.kind, run.id, projectId),
        };
      }, Effect.provide(services)),
    });
  }),
);

/** Audit tools available to every MCP client. Requires `AuditRepo`, `AuditHistoryRepo`, `WorkspaceStore`. */
export const AuditMcpLive = McpServer.toolkit(AuditMcpToolkit).pipe(
  Layer.provide(AuditMcpToolsLive),
  Layer.provide(PortalLinks.layer),
);
