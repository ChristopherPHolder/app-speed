import { Effect, Schema } from 'effect';
import { createRunner, parse as puppeteerReplayParse } from '@puppeteer/replay';
import { generateReport, startFlow } from 'lighthouse';

import { Audit, PuppeteerReplayUserflowRunnerSchema } from '@app-speed/audit/domain';

import { AuditConfig } from './audit-config';
import { RunnerContext } from './runner-context';
import { UserFlowRunnerExtension } from './runner-extension';
import { AuditRequestSchema } from '../queue/control-plane.effect';

class RunnerError extends Schema.TaggedError<RunnerError>()('RunnerFailed', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export const runAudit = Effect.fn((audit: Audit) =>
  Effect.gen(function* () {
    yield* Effect.annotateCurrentSpan({
      'audit.title': audit.title,
      'audit.device': audit.device,
    });

    const runnerScript = yield* Schema.decodeUnknown(PuppeteerReplayUserflowRunnerSchema)(audit).pipe(
      Effect.withSpan('runner.audit.decodeRunnerScript'),
    );
    const replayScript = yield* Effect.sync(() => puppeteerReplayParse(runnerScript)).pipe(
      Effect.withSpan('runner.audit.parseReplayScript'),
    );

    const runnerDeviceConfiguration = yield* AuditConfig(audit.device);
    const { browser, page } = yield* RunnerContext(runnerDeviceConfiguration);

    const flow = yield* Effect.promise(() =>
      startFlow(page, { name: audit.title, config: runnerDeviceConfiguration.lighthousePreset }),
    ).pipe(Effect.withSpan('runner.audit.startFlow'));

    const runnerExtension = new UserFlowRunnerExtension(browser, page, flow);

    yield* Effect.tryPromise({
      try: () => createRunner(replayScript, runnerExtension).then((runner) => runner.run()),
      catch: (cause) =>
        new RunnerError({
          message: cause instanceof Error ? cause.message : 'Audit failed during while running',
          cause,
        }),
    }).pipe(Effect.withSpan('runner.audit.executeReplay'));

    const flowResult = yield* Effect.promise(() => flow.createFlowResult()).pipe(
      Effect.withSpan('runner.audit.createFlowResult'),
    );
    const reportHtml = yield* Effect.sync(() => generateReport(flowResult, 'html')).pipe(
      Effect.withSpan('runner.audit.createReportHtml'),
    );

    return { flowResult, reportHtml };
  }).pipe(Effect.withSpan('runner.audit.process'), Effect.scoped),
);

export const processAudit = Effect.fn((auditRequest: typeof AuditRequestSchema.Type) => {
  return Effect.gen(function* () {
    yield* Effect.annotateCurrentSpan({ 'audit.id': auditRequest.auditId });
    yield* Effect.log(`Starting processing ${auditRequest.auditId}`);

    const result = yield* runAudit(auditRequest.auditDetails);

    yield* Effect.log(`Completed processing ${auditRequest.auditId}`);

    return result;
  });
});
