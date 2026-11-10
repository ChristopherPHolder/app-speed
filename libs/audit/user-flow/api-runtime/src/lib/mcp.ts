import { Effect, Layer, Option, Predicate, Schema } from 'effect';
import { McpServer, Tool, Toolkit } from 'effect/ai';
import { mcpAuditProject, PortalLinks, RunnerLifecycle } from '@app-speed/audit/core/api-runtime';
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
  value: Schema.NullOr(Schema.Finite),
  displayValue: Schema.NullOr(Schema.String),
  score: Schema.NullOr(Schema.Finite),
});
const timeSavingMetrics = ['LCP', 'FCP', 'TBT', 'INP'] as const;
const MetricSavings = Schema.Struct({
  LCP: Schema.optional(Schema.Finite),
  FCP: Schema.optional(Schema.Finite),
  TBT: Schema.optional(Schema.Finite),
  INP: Schema.optional(Schema.Finite),
  CLS: Schema.optional(Schema.Finite),
});
const Opportunity = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  displayValue: Schema.NullOr(Schema.String),
  score: Schema.NullOr(Schema.Finite),
  /** Largest estimated time saving across LCP, FCP, TBT and INP, in milliseconds. */
  savingsMs: Schema.NullOr(Schema.Finite),
  /** Estimated savings per metric as reported by Lighthouse (milliseconds, unitless for CLS). */
  metricSavings: MetricSavings,
});
const StepSummary = Schema.Struct({
  name: Schema.String,
  gatherMode: Schema.NullOr(Schema.String),
  url: Schema.NullOr(Schema.String),
  /** Category scores from 0 to 100. Categories that do not apply to the gather mode are null. */
  scores: Schema.Record(Schema.String, Schema.NullOr(Schema.Finite)),
  metrics: Schema.Array(Metric),
  opportunities: Schema.Array(Opportunity),
});
export const UserFlowResultSummarySchema = Schema.Struct({ steps: Schema.Array(StepSummary) });
export type UserFlowResultSummary = typeof UserFlowResultSummarySchema.Type;

// The subset of a Lighthouse flow result the summary reads. Unknown fields are ignored; missing ones stay optional.
const LighthouseAudit = Schema.Struct({
  title: Schema.optional(Schema.String),
  score: Schema.optional(Schema.NullOr(Schema.Finite)),
  numericValue: Schema.optional(Schema.Finite),
  displayValue: Schema.optional(Schema.String),
  details: Schema.optional(
    Schema.Struct({ type: Schema.optional(Schema.String), overallSavingsMs: Schema.optional(Schema.Finite) }),
  ),
  metricSavings: Schema.optional(MetricSavings),
});
const LighthouseFlowResult = Schema.Struct({
  steps: Schema.Array(
    Schema.Struct({
      name: Schema.optional(Schema.String),
      lhr: Schema.Struct({
        gatherMode: Schema.optional(Schema.String),
        finalDisplayedUrl: Schema.optional(Schema.String),
        finalUrl: Schema.optional(Schema.String),
        categories: Schema.optional(
          Schema.Record(
            Schema.String,
            Schema.Struct({
              score: Schema.optional(Schema.NullOr(Schema.Finite)),
              auditRefs: Schema.optional(
                Schema.Array(Schema.Struct({ id: Schema.String, group: Schema.optional(Schema.String) })),
              ),
            }),
          ),
        ),
        audits: Schema.optional(Schema.Record(Schema.String, LighthouseAudit)),
      }),
    }),
  ),
});
const decodeFlowResult = Schema.decodeUnknownEffect(LighthouseFlowResult);

/**
 * Condenses a Lighthouse flow result (several MB of JSON) to what an agent needs to reason about performance:
 * category scores, core metrics and the largest opportunities per step. The HTML report link has the rest.
 */
export const summarizeFlowResult = Effect.fn('summarizeFlowResult')(function* (flowResult: unknown) {
  const { steps } = yield* decodeFlowResult(flowResult);
  return {
    steps: steps.map((step, index) => {
      const audits = step.lhr.audits ?? {};
      const categories = step.lhr.categories ?? {};
      const scores = Object.fromEntries(
        categoryKeys.map((key) => {
          const score = categories[key]?.score;
          return [key, score === undefined || score === null ? null : Math.round(score * 100)];
        }),
      );
      const metrics = metricKeys.flatMap((id) => {
        const audit = audits[id];
        if (!audit) return [];
        return [
          {
            id,
            title: audit.title ?? id,
            value: audit.numericValue ?? null,
            displayValue: audit.displayValue ?? null,
            score: audit.score ?? null,
          },
        ];
      });
      // Lighthouse 13 reports recommendations as insight and diagnostic audits scored by metric savings; older
      // results use `opportunity` details instead.
      const recommended = new Set(
        (categories['performance']?.auditRefs ?? [])
          .filter((ref) => ref.group === 'insights' || ref.group === 'diagnostics')
          .map((ref) => ref.id),
      );
      const opportunities = Object.entries(audits)
        .filter(
          ([id, audit]) =>
            (recommended.has(id) || audit.details?.type === 'opportunity') &&
            Predicate.isNumber(audit.score) &&
            audit.score < 0.9,
        )
        .map(([id, audit]) => {
          const timeSavings = timeSavingMetrics.flatMap((metric) => audit.metricSavings?.[metric] ?? []);
          return {
            id,
            title: audit.title ?? id,
            displayValue: audit.displayValue ?? null,
            score: audit.score ?? null,
            savingsMs: audit.details?.overallSavingsMs ?? (timeSavings.length > 0 ? Math.max(...timeSavings) : null),
            metricSavings: audit.metricSavings ?? {},
          };
        })
        .sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0) || (a.score ?? 1) - (b.score ?? 1))
        .slice(0, 5);
      return {
        name: step.name ?? `Step ${index + 1}`,
        gatherMode: step.lhr.gatherMode ?? null,
        url: step.lhr.finalDisplayedUrl ?? step.lhr.finalUrl ?? null,
        scores,
        metrics,
        opportunities,
      } satisfies UserFlowResultSummary['steps'][number];
    }),
  };
});

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
    queuePosition: Schema.Finite,
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
    queuePosition: Schema.Finite,
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
    'top recommendations (Lighthouse insights with estimated savings). Returns the error for failed runs. Includes a link to the full HTML report.',
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

const StoredError = Schema.Struct({ name: Schema.optional(Schema.String), message: Schema.optional(Schema.String) });
const describeError = (error: unknown) => {
  const decoded = Schema.decodeUnknownOption(StoredError)(error);
  return {
    name: Option.flatMapNullishOr(decoded, (value) => value.name).pipe(Option.getOrElse(() => 'Error')),
    message: Option.flatMapNullishOr(decoded, (value) => value.message).pipe(
      Option.orElse(() => Option.liftPredicate(error, Predicate.isString)),
      Option.getOrElse(() => 'The audit failed.'),
    ),
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

    const requireRun = Effect.fn('requireRun')(function* (auditId: string, projectId: string | null) {
      const notFound = new McpToolError({
        message: `User-flow audit ${auditId} was not found in this scope. Audits in a project require its projectId.`,
      });
      const id = yield* Schema.decodeEffect(AuditRunIdSchema)(auditId).pipe(Effect.mapError(() => notFound));
      const run = yield* repo.getRunById(id).pipe(Effect.mapError(unavailable));
      if (run === null || run.kind !== USER_FLOW_AUDIT_KIND_LITERAL || run.projectId !== projectId)
        return yield* notFound;
      return run;
    });

    return UserFlowMcpToolkit.of({
      schedule_user_flow_audit: Effect.fn('UserFlowMcpToolkit.schedule_user_flow_audit')(function* (params) {
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
      }, Effect.provide(services)),
      get_user_flow_audit: Effect.fn('UserFlowMcpToolkit.get_user_flow_audit')(function* (params) {
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
      }, Effect.provide(services)),
      get_user_flow_audit_result: Effect.fn('UserFlowMcpToolkit.get_user_flow_audit_result')(function* (params) {
        const projectId = yield* mcpAuditProject(params.projectId);
        const run = yield* requireRun(params.auditId, projectId);
        const url = links.audit(USER_FLOW_AUDIT_KIND_LITERAL, run.id, projectId);
        const result = yield* userFlowRepo.getResultByRunId(run.id).pipe(Effect.mapError(unavailable));
        if (result === null)
          return yield* new McpToolError({
            message: `Audit ${run.id} is ${run.status.toLowerCase().replace('_', ' ')}; poll get_audit_status until COMPLETE.`,
          });
        if (result.status === 'FAILURE') return { status: 'FAILURE' as const, error: describeError(result.error), url };
        const summary = yield* summarizeFlowResult(result.flowResult).pipe(
          Effect.mapError(
            () => new McpToolError({ message: `The result could not be summarized. Open the full report: ${url}` }),
          ),
        );
        return { status: 'SUCCESS' as const, ...summary, url };
      }, Effect.provide(services)),
    });
  }),
);

/** User-flow audit tools. Requires the audit repositories, scheduler, runner lifecycle and `WorkspaceStore`. */
export const UserFlowMcpLive = McpServer.toolkit(UserFlowMcpToolkit).pipe(
  Layer.provide(UserFlowMcpToolsLive),
  Layer.provide(PortalLinks.layer),
);
