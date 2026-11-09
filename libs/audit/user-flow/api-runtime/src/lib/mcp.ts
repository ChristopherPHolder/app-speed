import { Effect, Layer, Schema } from 'effect';
import { McpServer, Tool, Toolkit } from 'effect/ai';
import { mcpAuditProject, PortalLinks, PortalLinksLive, RunnerLifecycle } from '@app-speed/audit/core/api-runtime';
import { AuditRepo, AuditRunIdSchema } from '@app-speed/audit/core/persistence';
import { UserFlowAuditDefinitionSchema, USER_FLOW_AUDIT_KIND_LITERAL } from '@app-speed/audit/user-flow/domain';
import { UserFlowAuditRepo, UserFlowAuditScheduler } from '@app-speed/audit/user-flow/persistence';
import { currentMcpClient, McpCaller, McpToolError } from '@app-speed/platform/mcp';
import { WorkspaceStore } from '@app-speed/workspace/api-runtime';

const ProjectIdParameter = Schema.optional(
  Schema.String.annotate({
    description:
      'Project to act in (from get_workspaces). Omit to use Public View, where audits are visible to everyone.',
  }),
);
const RunStatus = Schema.Literals(['SCHEDULED', 'IN_PROGRESS', 'COMPLETE']);

const categoryKeys = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
const metricKeys = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
  'interactive',
  'interaction-to-next-paint',
] as const;

const Metric = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  value: Schema.NullOr(Schema.Number),
  displayValue: Schema.NullOr(Schema.String),
  score: Schema.NullOr(Schema.Number),
});
const Opportunity = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  displayValue: Schema.NullOr(Schema.String),
  score: Schema.NullOr(Schema.Number),
  savingsMs: Schema.NullOr(Schema.Number),
});
const StepSummary = Schema.Struct({
  name: Schema.String,
  gatherMode: Schema.NullOr(Schema.String),
  url: Schema.NullOr(Schema.String),
  /** Category scores from 0 to 100. Categories that do not apply to the gather mode are null. */
  scores: Schema.Record(Schema.String, Schema.NullOr(Schema.Number)),
  metrics: Schema.Array(Metric),
  opportunities: Schema.Array(Opportunity),
});
export const UserFlowResultSummarySchema = Schema.Struct({ steps: Schema.Array(StepSummary) });
export type UserFlowResultSummary = typeof UserFlowResultSummarySchema.Type;

type JsonRecord = Readonly<Record<string, unknown>>;
const record = (value: unknown): JsonRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
const text = (value: unknown) => (typeof value === 'string' ? value : null);
const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/**
 * Condenses a Lighthouse flow result (several MB of JSON) to what an agent needs to reason about performance:
 * category scores, core metrics and the largest opportunities per step. The HTML report link has the rest.
 */
export const summarizeFlowResult = (flowResult: unknown): UserFlowResultSummary => {
  const steps = record(flowResult)['steps'];
  return {
    steps: (Array.isArray(steps) ? steps : []).map((step, index) => {
      const lhr = record(record(step)['lhr']);
      const audits = record(lhr['audits']);
      const categories = record(lhr['categories']);
      const scores = Object.fromEntries(
        categoryKeys.map((key) => {
          const score = number(record(categories[key])['score']);
          return [key, score === null ? null : Math.round(score * 100)];
        }),
      );
      const metrics = metricKeys.flatMap((id) => {
        const audit = record(audits[id]);
        if (Object.keys(audit).length === 0) return [];
        return [
          {
            id,
            title: text(audit['title']) ?? id,
            value: number(audit['numericValue']),
            displayValue: text(audit['displayValue']),
            score: number(audit['score']),
          },
        ];
      });
      const opportunities = Object.entries(audits)
        .map(([id, value]) => ({ id, audit: record(value) }))
        .filter(({ audit }) => {
          const score = number(audit['score']);
          return record(audit['details'])['type'] === 'opportunity' && score !== null && score < 0.9;
        })
        .map(({ id, audit }) => ({
          id,
          title: text(audit['title']) ?? id,
          displayValue: text(audit['displayValue']),
          score: number(audit['score']),
          savingsMs:
            number(record(audit['metricSavings'])['LCP']) ?? number(record(audit['details'])['overallSavingsMs']),
        }))
        .sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0))
        .slice(0, 5);
      return {
        name: text(record(step)['name']) ?? `Step ${index + 1}`,
        gatherMode: text(lhr['gatherMode']),
        url: text(lhr['finalDisplayedUrl']) ?? text(lhr['finalUrl']),
        scores,
        metrics,
        opportunities,
      };
    }),
  };
};

export const ScheduleUserFlowAudit = Tool.make('schedule_user_flow_audit', {
  description: [
    'Schedules a Lighthouse user-flow audit and returns immediately with its auditId and queue position.',
    'Audits take one to several minutes: poll get_audit_status until status is COMPLETE, then call',
    'get_user_flow_audit_result.',
    'Steps run in order in a real browser. Wrap measured interactions in Lighthouse steps:',
    '{type:"customStep",step:"startNavigation"} + {type:"navigate",url} + {type:"customStep",step:"endNavigation"}',
    'measures a page load; startTimespan/endTimespan measure interactions (click, change, keyDown, scroll, …) in',
    'between; {type:"customStep",step:"snapshot"} audits the current page state. At least one Lighthouse step is',
    'required. Steps follow the Chrome DevTools Recorder (Puppeteer Replay) format.',
  ].join(' '),
  parameters: Schema.Struct({ projectId: ProjectIdParameter, audit: UserFlowAuditDefinitionSchema }),
  success: Schema.Struct({
    auditId: Schema.String,
    queuePosition: Schema.Number,
    projectId: Schema.NullOr(Schema.String),
    url: Schema.String,
  }),
  failure: McpToolError,
  dependencies: [McpCaller],
})
  .annotate(Tool.Title, 'Schedule user-flow audit')
  .annotate(Tool.Readonly, false)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, false)
  // The runner opens the URLs in the audit definition.
  .annotate(Tool.OpenWorld, true);

export const GetUserFlowAudit = Tool.make('get_user_flow_audit', {
  description: 'Returns a user-flow audit definition (title, device, steps) and its status. Useful to re-run or edit.',
  parameters: Schema.Struct({ auditId: Schema.String, projectId: ProjectIdParameter }),
  success: Schema.Struct({
    auditId: Schema.String,
    status: RunStatus,
    queuePosition: Schema.Number,
    audit: UserFlowAuditDefinitionSchema,
    url: Schema.String,
  }),
  failure: McpToolError,
  dependencies: [McpCaller],
})
  .annotate(Tool.Title, 'Get user-flow audit')
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const GetUserFlowAuditResult = Tool.make('get_user_flow_audit_result', {
  description:
    'Summarizes a completed user-flow audit per step: Lighthouse category scores (0-100), core metrics and the ' +
    'largest opportunities. Returns the error for failed runs. Includes a link to the full HTML report.',
  parameters: Schema.Struct({ auditId: Schema.String, projectId: ProjectIdParameter }),
  success: Schema.Union([
    Schema.Struct({
      status: Schema.Literal('SUCCESS'),
      ...UserFlowResultSummarySchema.fields,
      url: Schema.String,
    }),
    Schema.Struct({
      status: Schema.Literal('FAILURE'),
      error: Schema.Struct({ name: Schema.String, message: Schema.String }),
      url: Schema.String,
    }),
  ]),
  failure: McpToolError,
  dependencies: [McpCaller],
})
  .annotate(Tool.Title, 'Get user-flow audit result')
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false)
  .annotate(Tool.Idempotent, true)
  .annotate(Tool.OpenWorld, false);

export const UserFlowMcpToolkit = Toolkit.make(ScheduleUserFlowAudit, GetUserFlowAudit, GetUserFlowAuditResult);

const describeError = (error: unknown) => {
  const value = record(error);
  return {
    name: text(value['name']) ?? 'Error',
    message: text(value['message']) ?? (typeof error === 'string' ? error : 'The audit failed.'),
  };
};

const unavailable = () => new McpToolError({ message: 'The audit could not be loaded. Please try again.' });

export const UserFlowMcpToolsLive = UserFlowMcpToolkit.toLayer(
  Effect.gen(function* () {
    const services = yield* Effect.context<
      AuditRepo | UserFlowAuditRepo | UserFlowAuditScheduler | RunnerLifecycle | WorkspaceStore | PortalLinks
    >();
    const repo = yield* AuditRepo;
    const userFlowRepo = yield* UserFlowAuditRepo;
    const scheduler = yield* UserFlowAuditScheduler;
    const runnerLifecycle = yield* RunnerLifecycle;
    const links = yield* PortalLinks;

    const requireRun = Effect.fn('mcp.userFlow.requireRun')(function* (auditId: string, projectId: string | null) {
      const notFound = new McpToolError({
        message: `User-flow audit ${auditId} was not found in this scope. Audits in a project require its projectId.`,
      });
      const id = yield* Schema.decodeUnknownEffect(AuditRunIdSchema)(auditId).pipe(Effect.mapError(() => notFound));
      const run = yield* repo.getRunById(id).pipe(Effect.mapError(unavailable));
      if (run === null || run.kind !== USER_FLOW_AUDIT_KIND_LITERAL || run.projectId !== projectId)
        return yield* notFound;
      return run;
    });

    return UserFlowMcpToolkit.of({
      schedule_user_flow_audit: (params) =>
        Effect.gen(function* () {
          const projectId = yield* mcpAuditProject(params.projectId);
          const client = yield* currentMcpClient;
          const auditId = yield* scheduler
            .schedule(params.audit, projectId, {
              source: 'mcp',
              clientId: client.clientId,
              clientName: client.clientName,
            })
            .pipe(Effect.mapError(() => new McpToolError({ message: 'The audit could not be scheduled.' })));
          const queuePosition = yield* repo.getQueuePosition(auditId).pipe(Effect.mapError(unavailable));
          yield* runnerLifecycle.requestActivation;
          return {
            auditId,
            queuePosition: queuePosition ?? 0,
            projectId,
            url: links.audit(USER_FLOW_AUDIT_KIND_LITERAL, auditId, projectId),
          };
        }).pipe(Effect.provide(services)),
      get_user_flow_audit: (params) =>
        Effect.gen(function* () {
          const projectId = yield* mcpAuditProject(params.projectId);
          const run = yield* requireRun(params.auditId, projectId);
          const audit = yield* userFlowRepo.getDefinition(run.templateId).pipe(Effect.mapError(unavailable));
          if (audit === null) return yield* unavailable();
          return {
            auditId: run.id,
            status: run.status,
            queuePosition: (yield* repo.getQueuePosition(run.id).pipe(Effect.mapError(unavailable))) ?? 0,
            audit,
            url: links.audit(USER_FLOW_AUDIT_KIND_LITERAL, run.id, projectId),
          };
        }).pipe(Effect.provide(services)),
      get_user_flow_audit_result: (params) =>
        Effect.gen(function* () {
          const projectId = yield* mcpAuditProject(params.projectId);
          const run = yield* requireRun(params.auditId, projectId);
          const url = links.audit(USER_FLOW_AUDIT_KIND_LITERAL, run.id, projectId);
          const result = yield* userFlowRepo.getResultByRunId(run.id).pipe(Effect.mapError(unavailable));
          if (result === null)
            return yield* new McpToolError({
              message: `Audit ${run.id} is ${run.status.toLowerCase().replace('_', ' ')}; poll get_audit_status until COMPLETE.`,
            });
          return result.status === 'SUCCESS'
            ? { status: 'SUCCESS' as const, ...summarizeFlowResult(result.flowResult), url }
            : { status: 'FAILURE' as const, error: describeError(result.error), url };
        }).pipe(Effect.provide(services)),
    });
  }),
);

/** User-flow audit tools. Requires the audit repositories, scheduler, runner lifecycle and `WorkspaceStore`. */
export const UserFlowMcpLive = McpServer.toolkit(UserFlowMcpToolkit).pipe(
  Layer.provide(UserFlowMcpToolsLive),
  Layer.provide(PortalLinksLive),
);
